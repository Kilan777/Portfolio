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

ITER = 600_000
MAX_W = 1800          # same cap as tools/optimize_media.py for content figures
MAX_VIDEO_W = 1280
PIPELINE = b'v1'      # bump to force every media file to be re-processed

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


def convert_image(src):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=82, method=6)
    return buf.getvalue(), 'image/webp', im.width, im.height


def convert_video(src):
    ffmpeg = shutil.which('ffmpeg') or die('ffmpeg is needed for videos')
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'v.mp4')
        subprocess.run([ffmpeg, '-loglevel', 'error', '-y', '-i', src,
                        '-vf', f"scale='min({MAX_VIDEO_W},iw)':-2", '-c:v', 'libx264', '-preset', 'slow',
                        '-crf', '27', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k',
                        '-movflags', '+faststart', out], check=True)
        probe = subprocess.run([ffmpeg, '-i', out], capture_output=True, text=True).stderr
        m = re.search(r'Video:.*?(\d{2,5})x(\d{2,5})', probe)
        w, h = (int(m.group(1)), int(m.group(2))) if m else (None, None)
        with open(out, 'rb') as f:
            return f.read(), 'video/mp4', w, h


def set_attr(tag, name, value):
    """Set or replace an attribute in an opening tag string."""
    pat = re.compile(r'\s%s\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)' % re.escape(name))
    new = ' %s="%s"' % (name, html.escape(str(value), quote=True))
    if pat.search(tag):
        return pat.sub(new, tag, count=1)
    return re.sub(r'\s*(/?>)$', new + r'\1', tag, count=1)


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
        with open(path, 'rb') as f:
            digest = hashlib.sha256(PIPELINE + f.read()).hexdigest()
        name = hmac.new(key, digest.encode(), hashlib.sha256).hexdigest()[:24] + '.bin'
        entry = media.get(digest)
        if not entry or entry.get('name') != name or not os.path.exists(os.path.join(enc_dir, name)):
            data, mime, w, h = convert_video(path) if is_video else convert_image(path)
            iv = os.urandom(12)
            with open(os.path.join(enc_dir, name), 'wb') as f:
                f.write(iv + aes.encrypt(iv, data, None))
            entry = {'name': name, 'type': mime, 'w': w, 'h': h, 'src': os.path.relpath(path, src_dir)}
            media[digest] = entry
            print('  encrypted %s -> %s/%s (%d KB)' % (ref, enc_rel, name, len(data) // 1024))
        used.add(name)
        tag = drop_attr(tag, 'src')
        tag = set_attr(tag, 'data-enc', enc_rel + '/' + name)
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
    cfg['media'] = {d: e for d, e in media.items() if e['name'] in used}

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
