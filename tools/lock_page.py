#!/usr/bin/env python3
"""Build a password-locked page from a private plaintext source.

    python3 tools/lock_page.py private/autopallet.html experience/autopallet.html

The source is a normal page written as if it lived next to the output (so
../styles.css etc. resolve the same), kept in private/ which is gitignored.
Everything between <!-- lock:start --> and <!-- lock:end --> is encrypted;
the rest of the page (nav, hero, footer) stays public.

Inside the locked region, <img src> and <video src> pointing at files inside
the private folder are converted (images to WebP, videos to H.264 MP4), encrypted one file each
into <output dir>/<page>-enc/<opaque name>.bin and rewritten to data-enc, so
neither the content nor the media can be read without the password.

Images get two sizes: data-enc (720 px, for phones and small figures) and
data-enc-lg (1600 px); lock.js picks one by rendered width and loads the large
one for the lightbox. Videos become short silent loops (long side 960 px) with
a small encrypted poster (data-poster-enc). Optional source attributes, all
removed from the output:
    data-rotate="-90"         turn clockwise by 90, 180 or -90 degrees (before cropping)
    data-crop="x0,y0,x1,y1"   crop, as fractions of the (upright) frame
    data-trim="start-end"     videos: seconds to keep
    data-speed="4"            videos: play this many times faster

Crypto: AES-256-GCM, key = PBKDF2-SHA256(password, salt, 600k). lock.js
decrypts in the browser. The salt lives in private/.lock-<page>.json so the
key, and with it the media file names, stay stable between builds: only new
or changed media is re-encrypted, which keeps git history small. Delete that
file (or pass --new-salt) after changing the password.

Password: $LOCK_PASSWORD, otherwise prompted. It is never written to disk.
"""
import base64, getpass, hashlib, hmac, html, io, json, os, re, shutil, subprocess, sys, tempfile

from PIL import Image, ImageOps
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass              # HEIC sources then need converting first

ITER = 600_000
LG_W = 1600           # large image size, also what the lightbox shows
SM_W = 720            # small image size, made when the source is wider than SM_MIN
SM_MIN = 960
VIDEO_LONG = 960      # long side of video loops
POSTER_W = 480
PIPELINE = b'v2'      # bump to force every media file to be re-processed

IMG_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif', '.bmp', '.tif', '.tiff'}
VID_EXT = {'.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv'}

LOCK_BOX = '''<div class="container" data-lock>
            <div class="lock">
                <svg class="lock__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2"/></svg>
                <h2 class="lock__title">{title}</h2>
                <p class="lock__text">{text}</p>
                <form class="lock__form" hidden>
                    <label class="sr-only" for="lock-pw">Password</label>
                    <input id="lock-pw" type="password" name="password" placeholder="Password" autocomplete="current-password" required>
                    <button type="submit" class="btn btn--primary">Unlock</button>
                </form>
                <p class="lock__error" role="alert" aria-live="polite"></p>
                <noscript><p class="lock__text">Unlocking needs JavaScript.</p></noscript>
            </div>
        </div>
        <script type="application/json" id="lock-data">{payload}</script>'''

DEFAULT_TITLE = 'This page is under NDA'
DEFAULT_TEXT = ('The work I did here is covered by a non-disclosure agreement. '
                '<a href="../contact.html">Ask Kilan</a> for the password to view it.')


def b64(b):
    return base64.b64encode(b).decode()


def die(msg):
    sys.exit('lock_page: ' + msg)


def parse_crop(value):
    if not value:
        return None
    box = [float(v) for v in value.split(',')]
    if len(box) != 4 or not (0 <= box[0] < box[2] <= 1 and 0 <= box[1] < box[3] <= 1):
        die('bad data-crop: ' + value)
    return box


def parse_rotate(value):
    if not value:
        return 0
    deg = int(value) % 360
    if deg not in (90, 180, 270):
        die('bad data-rotate: ' + value)
    return deg


def webp(im, width, quality):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=quality, method=6)
    return buf.getvalue(), im.width, im.height


def convert_image(src, crop, rotate):
    """-> {'lg': (bytes, w, h), 'sm': (bytes, w, h) or missing}"""
    im = ImageOps.exif_transpose(Image.open(src))
    if rotate:
        im = im.rotate(-rotate, expand=True)    # PIL turns counter-clockwise
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    if crop:
        w, h = im.size
        im = im.crop((round(crop[0] * w), round(crop[1] * h), round(crop[2] * w), round(crop[3] * h)))
    q = 88 if src.lower().endswith('.png') else 80     # diagrams and renders stay crisp
    out = {'lg': webp(im, LG_W, q)}
    if im.width > SM_MIN:
        out['sm'] = webp(im, SM_W, q)
    return out


def convert_video(src, crop, trim, speed, rotate):
    """-> {'video': (bytes, w, h), 'poster': (bytes, w, h)}"""
    ffmpeg = shutil.which('ffmpeg') or die('ffmpeg is needed for videos')
    pre = []
    if trim:
        a, b = (float(v) for v in trim.split('-'))
        pre = ['-ss', '%.3f' % a, '-to', '%.3f' % b]
    vf = {0: [], 90: ['transpose=1'], 180: ['transpose=1', 'transpose=1'], 270: ['transpose=2']}[rotate]
    if crop:
        vf.append('crop=iw*%.4f:ih*%.4f:iw*%.4f:ih*%.4f' % (crop[2] - crop[0], crop[3] - crop[1], crop[0], crop[1]))
    if speed and float(speed) != 1:
        vf.append('setpts=PTS/%s' % float(speed))
    L = VIDEO_LONG
    vf += ["scale='if(gt(iw,ih),min(%d,iw),-2)':'if(gt(iw,ih),-2,min(%d,ih))'" % (L, L), 'fps=30']
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'v.mp4')
        subprocess.run([ffmpeg, '-loglevel', 'error', '-y'] + pre + ['-i', src, '-vf', ','.join(vf), '-an',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-profile:v', 'high',
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], check=True)
        png = os.path.join(tmp, 'p.png')
        subprocess.run([ffmpeg, '-loglevel', 'error', '-y', '-i', out, '-frames:v', '1', png], check=True)
        poster = Image.open(png).convert('RGB')
        w, h = poster.size
        with open(out, 'rb') as f:
            return {'video': (f.read(), w, h), 'poster': webp(poster, POSTER_W, 60)}


def set_attr(tag, name, value):
    """Set or replace an attribute in an opening tag string."""
    pat = re.compile(r'\s%s\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)' % re.escape(name))
    new = ' %s="%s"' % (name, html.escape(str(value), quote=True))
    if pat.search(tag):
        return pat.sub(new, tag, count=1)
    return re.sub(r'\s*(/?>)$', new + r'\1', tag, count=1)


def get_attr(tag, name):
    m = re.search(r'\s%s\s*=\s*"([^"]*)"' % re.escape(name), tag)
    return m.group(1) if m else None


def drop_attr(tag, name):
    return re.sub(r'\s%s\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)' % re.escape(name), '', tag)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        die('usage: lock_page.py <private source.html> <output.html> [--new-salt]')
    src_path, out_path = args
    src_dir = os.path.dirname(os.path.abspath(src_path))
    out_dir = os.path.dirname(os.path.abspath(out_path))
    page = os.path.splitext(os.path.basename(out_path))[0]
    enc_rel = page + '-enc'
    enc_dir = os.path.join(out_dir, enc_rel)

    with open(src_path, encoding='utf-8') as f:
        source = f.read()
    m = re.search(r'<!--\s*lock:start\s*-->(.*?)<!--\s*lock:end\s*-->', source, re.S)
    if not m:
        die('no <!-- lock:start --> … <!-- lock:end --> region in ' + src_path)
    region = m.group(1)

    # optional overrides for the lock box: <!-- lock:title … --> <!-- lock:text … -->
    title = re.search(r'<!--\s*lock:title\s+(.*?)\s*-->', source, re.S)
    text = re.search(r'<!--\s*lock:text\s+(.*?)\s*-->', source, re.S)

    # salt / media manifest
    cfg_path = os.path.join(src_dir, '.lock-%s.json' % page)
    cfg = {}
    if os.path.exists(cfg_path) and '--new-salt' not in sys.argv:
        with open(cfg_path) as f:
            cfg = json.load(f)
    if 'salt' not in cfg:
        cfg = {'salt': b64(os.urandom(16)), 'iter': ITER, 'media': {}}

    password = os.environ.get('LOCK_PASSWORD')
    if not password:
        password = getpass.getpass('Password for %s: ' % page)
        if not os.path.exists(cfg_path) and getpass.getpass('Again: ') != password:
            die('passwords do not match')
    if not password:
        die('empty password')

    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=base64.b64decode(cfg['salt']),
                     iterations=cfg['iter']).derive(password.encode())
    aes = AESGCM(key)

    # a check value so a mistyped password does not silently re-encrypt everything
    check = hmac.new(key, b'lock-check', hashlib.sha256).hexdigest()[:16]
    if cfg.get('check') and cfg['check'] != check:
        die('password does not match the one this page was built with (use --new-salt to change it)')
    cfg['check'] = check

    os.makedirs(enc_dir, exist_ok=True)
    used = set()
    media = cfg.setdefault('media', {})

    def process(match):
        tag = match.group(0)
        sm = re.search(r'\ssrc\s*=\s*"([^"]+)"', tag)
        if not sm or re.match(r'(https?:)?//|data:', sm.group(1)):
            return tag
        ref = sm.group(1)
        path = os.path.normpath(os.path.join(src_dir, ref))
        if not path.startswith(src_dir + os.sep):
            return tag    # already-public files (../Pics/…) stay as they are
        if not os.path.isfile(path):
            die('missing media file: %s (from %s)' % (ref, src_path))
        ext = os.path.splitext(path)[1].lower()
        is_video = tag.lower().startswith('<video')
        if not is_video and ext not in IMG_EXT or is_video and ext not in VID_EXT:
            die('unsupported media type: ' + ref)
        crop, trim, speed = get_attr(tag, 'data-crop'), get_attr(tag, 'data-trim'), get_attr(tag, 'data-speed')
        rotate = parse_rotate(get_attr(tag, 'data-rotate'))
        h256 = hashlib.sha256(PIPELINE + ('|%s|%s|%s|' % (crop, trim, speed)).encode()
                              + (b'rot%d|' % rotate if rotate else b''))
        with open(path, 'rb') as f:
            for block in iter(lambda: f.read(1 << 20), b''):
                h256.update(block)
        digest = h256.hexdigest()
        entry = media.get(digest)
        if not entry or 'files' not in entry or not all(
                os.path.exists(os.path.join(enc_dir, n)) for n in entry['files'].values()):
            parts = (convert_video(path, parse_crop(crop), trim, speed, rotate) if is_video
                     else convert_image(path, parse_crop(crop), rotate))
            files = {}
            for part, (data, w, h) in parts.items():
                name = hmac.new(key, (digest + part).encode(), hashlib.sha256).hexdigest()[:24] + '.bin'
                iv = os.urandom(12)
                with open(os.path.join(enc_dir, name), 'wb') as f:
                    f.write(iv + aes.encrypt(iv, data, None))
                files[part] = name
                print('  encrypted %s [%s] -> %s (%d KB)' % (ref, part, name, len(data) // 1024))
            main_part = 'video' if is_video else 'lg'
            entry = {'files': files, 'type': 'video/mp4' if is_video else 'image/webp',
                     'w': parts[main_part][1], 'h': parts[main_part][2], 'src': os.path.relpath(path, src_dir)}
            media[digest] = entry
        files = entry['files']
        used.update(files.values())
        for a in ('src', 'data-crop', 'data-trim', 'data-speed', 'data-rotate'):
            tag = drop_attr(tag, a)
        if is_video:
            tag = set_attr(tag, 'data-enc', enc_rel + '/' + files['video'])
            tag = set_attr(tag, 'data-poster-enc', enc_rel + '/' + files['poster'])
            tag = set_attr(tag, 'preload', 'none')
        else:
            tag = set_attr(tag, 'data-enc', enc_rel + '/' + files.get('sm', files['lg']))
            if 'sm' in files:
                tag = set_attr(tag, 'data-enc-lg', enc_rel + '/' + files['lg'])
            tag = set_attr(tag, 'decoding', 'async')
        tag = set_attr(tag, 'data-type', entry['type'])
        if entry.get('w') and not re.search(r'\swidth\s*=', tag):
            tag = set_attr(tag, 'width', entry['w'])
            tag = set_attr(tag, 'height', entry['h'])
        return tag

    region = re.sub(r'<(img|video)\b[^>]*>', process, region, flags=re.I)

    # media that is no longer referenced
    for fn in os.listdir(enc_dir):
        if fn.endswith('.bin') and fn not in used:
            os.remove(os.path.join(enc_dir, fn))
            print('  removed stale', fn)
    cfg['media'] = {d: e for d, e in media.items()
                    if 'files' in e and set(e['files'].values()) <= used}

    iv = os.urandom(12)
    payload = json.dumps({'v': 1, 'salt': cfg['salt'], 'iter': cfg['iter'], 'iv': b64(iv),
                          'ct': b64(aes.encrypt(iv, region.strip().encode(), None))}, separators=(',', ':'))
    box = (LOCK_BOX.replace('{title}', title.group(1) if title else DEFAULT_TITLE)
                   .replace('{text}', text.group(1) if text else DEFAULT_TEXT)
                   .replace('{payload}', payload))
    out = source[:m.start()] + box + source[m.end():]
    out = re.sub(r'\s*<!--\s*(lock:title|lock:text|private:)\s.*?-->', '', out, flags=re.S)

    sm = re.search(r'<script src="([^"]*script\.js[^"]*)"></script>', out)
    if not sm:
        die('no <script src="…script.js"> tag to hand over to lock.js')
    lock_src = re.sub(r'script\.js.*$', 'lock.js', sm.group(1))
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lock.js'), 'rb') as f:
        lock_src += '?v=' + hashlib.sha256(f.read()).hexdigest()[:8]    # new lock.js, new URL
    out = out.replace(sm.group(0), '<script src="%s" data-main="%s"></script>' % (lock_src, sm.group(1)))

    if re.search(r'private/', out):
        die('output still references private/ outside the locked region')

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(out)
    with open(cfg_path, 'w') as f:
        json.dump(cfg, f, indent=1)
    print('wrote %s (%d media files)' % (out_path, len(used)))


if __name__ == '__main__':
    main()
