#!/usr/bin/env python3
"""Media pipeline for the portfolio.

1. Every raster image referenced from HTML (png/jpg/jpeg, any case) is
   resized (max width by role) and re-encoded as WebP next to the original.
   References in HTML/CSS/JSON-LD are rewritten to the .webp path and the
   original file is deleted from the working tree (still in git history).
2. GIFs referenced from HTML are converted to MP4 (h264) and the <img> is
   replaced with an autoplaying muted <video>.
3. <img> tags get width/height (intrinsic, for layout stability),
   loading="lazy" + decoding="async" unless they are above the fold
   (first image on the page / hero / nav logo / fetchpriority=high).
4. Pics/og.jpg (1200x630) is generated from the headshot for social cards.

Run from the repo root: python3 optimize_media.py [--dry]
"""
import os, re, sys, glob, subprocess, shutil
from urllib.parse import unquote, quote
from PIL import Image, ImageOps

ROOT = os.getcwd()
DRY = '--dry' in sys.argv
FFMPEG = os.environ.get('FFMPEG', shutil.which('ffmpeg') or '/tmp/claude-1000/-home-kilan/b1beaca3-8820-47c8-b4b6-4bb4ff5d8ff1/scratchpad/tools/node_modules/ffmpeg-static/ffmpeg')

HTML = sorted(glob.glob('*.html') + glob.glob('projects/*.html') + glob.glob('experience/*.html'))
RASTER = re.compile(r'\.(png|jpe?g)$', re.I)

# width caps by role
MAX_CONTENT = 1800      # figures, lead media
MAX_CARD = 900          # Pics/ card images
MAX_LOGO = 400          # logos
MAX_HERO = 1400         # headshot

def role_for(path):
    base = os.path.basename(path).lower()
    if path.startswith('Pics/'):
        if 'logo' in base: return MAX_LOGO
        if base in ('webicon.png', 'og.jpg'): return None   # favicon and social image stay as-is
        return MAX_CARD if base != 'headshot.jpg' else MAX_HERO
    return MAX_CONTENT

def is_logo(path):
    return 'logo' in os.path.basename(path).lower()

# --- collect references -------------------------------------------------
ATTR = re.compile(r'''(src|href|content|poster|data-poster|url)\s*[=(]\s*(["']?)([^"'()\s>]+)\2''')

def resolve(page, ref):
    ref = unquote(ref.split('?')[0].split('#')[0])
    if ref.startswith(('http://', 'https://', '//', 'data:', 'mailto:', 'tel:', '#')):
        # absolute site URLs → local path
        for pre in ('https://kilanrou.com/', 'https://kilanrougeot.com/'):
            if ref.startswith(pre):
                return os.path.normpath(ref[len(pre):])
        return None
    if ref.startswith('/'):
        return os.path.normpath(ref.lstrip('/'))
    return os.path.normpath(os.path.join(os.path.dirname(page), ref))

referenced = {}   # local path -> set(pages)
for page in HTML:
    txt = open(page, encoding='utf-8').read()
    for m in ATTR.finditer(txt):
        p = resolve(page, m.group(3))
        if p and os.path.isfile(p):
            referenced.setdefault(p, set()).add(page)

# --- convert images -----------------------------------------------------
renames = {}   # old local path -> new local path
sizes = {}     # new local path -> (w, h)

def encode_webp(src, dst, maxw, logo):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    im = im.convert('RGBA' if has_alpha else 'RGB')
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    q = 90 if logo else 82
    im.save(dst, 'WEBP', quality=q, method=6)
    return im.size

total_before = total_after = 0
for path in sorted(referenced):
    if RASTER.search(path):
        maxw = role_for(path)
        if maxw is None:
            continue
        new = re.sub(RASTER, '.webp', path)
        before = os.path.getsize(path)
        if not DRY:
            w, h = encode_webp(path, new, maxw, is_logo(path))
            after = os.path.getsize(new)
            # if webp is not smaller (rare, tiny PNGs), still use it for consistency
            os.remove(path)
        else:
            w, h = Image.open(path).size; after = before
        renames[path] = new; sizes[new] = (w, h)
        total_before += before; total_after += after
        print(f'{before/1e6:6.2f} -> {after/1e6:6.2f} MB  {path} -> {new}  {w}x{h}')
    elif path.lower().endswith('.gif'):
        new = path[:-4] + '.mp4'
        before = os.path.getsize(path)
        if not DRY:
            subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', path,
                            '-movflags', 'faststart', '-pix_fmt', 'yuv420p',
                            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-crf', '24', '-an', new], check=True)
            # poster frame
            poster = path[:-4] + '.webp'
            subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', path, '-frames:v', '1', '-f', 'image2', poster + '.png'], check=True)
            im = Image.open(poster + '.png').convert('RGB'); im.save(poster, 'WEBP', quality=80); os.remove(poster + '.png')
            os.remove(path)
            after = os.path.getsize(new)
        else:
            after = before
        renames[path] = new
        total_before += before; total_after += after
        print(f'{before/1e6:6.2f} -> {after/1e6:6.2f} MB  {path} -> {new} (gif→mp4)')

print(f'\nTOTAL referenced media: {total_before/1e6:.1f} MB -> {total_after/1e6:.1f} MB')

# --- og image -----------------------------------------------------------
if not DRY:
    src = 'Pics/Headshot.webp' if os.path.exists('Pics/Headshot.webp') else 'Pics/Headshot.jpg'
    im = Image.open(src).convert('RGB')
    og = ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(0.5, 0.3))
    og.save('Pics/og.jpg', 'JPEG', quality=85, optimize=True, progressive=True)
    print('wrote Pics/og.jpg', os.path.getsize('Pics/og.jpg') // 1024, 'KB')

# --- rewrite HTML -------------------------------------------------------
IMG_TAG = re.compile(r'<img\b[^>]*>', re.I)

def rewrite_refs(page, txt):
    def sub(m):
        attr, q, ref = m.group(1), m.group(2), m.group(3)
        p = resolve(page, ref)
        if p in renames:
            newp = renames[p]
            # keep the reference style (relative / absolute / site URL)
            raw = ref.split('?')[0].split('#')[0]
            if raw.startswith(('https://kilanrou.com/', 'https://kilanrougeot.com/')):
                newref = 'https://kilanrou.com/' + newp
            elif raw.startswith('/'):
                newref = '/' + newp
            else:
                rel = os.path.relpath(newp, os.path.dirname(page) or '.')
                newref = rel
            # re-encode spaces the way the source did
            if '%20' in raw:
                newref = quote(newref, safe='/:.-_()')
            return f'{attr}{m.group(0)[len(attr):m.group(0).index(ref)]}{newref}{m.group(0)[m.group(0).index(ref)+len(ref):]}'
        return m.group(0)
    return ATTR.sub(sub, txt)

def gif_to_video(page, txt):
    def sub(m):
        tag = m.group(0)
        sm = re.search(r'src=["\']([^"\']+)["\']', tag)
        if not sm: return tag
        ref = sm.group(1)
        if not ref.lower().endswith('.mp4'): return tag
        p = resolve(page, ref)
        poster_local = p[:-4] + '.webp' if p else None
        poster = ''
        if poster_local and os.path.exists(poster_local):
            poster = f' poster="{os.path.relpath(poster_local, os.path.dirname(page) or ".")}"'
        alt = re.search(r'alt=["\']([^"\']*)["\']', tag)
        alt = alt.group(1) if alt else ''
        return (f'<video src="{ref}"{poster} autoplay muted loop playsinline preload="metadata" '
                f'aria-label="{alt}" title="{alt}"></video>')
    return IMG_TAG.sub(sub, txt)

def add_dims(page, txt):
    seen_first = {'n': 0}
    def sub(m):
        tag = m.group(0)
        sm = re.search(r'src=["\']([^"\']+)["\']', tag)
        if not sm: return tag
        p = resolve(page, sm.group(1))
        if not p: return tag
        dims = sizes.get(p)
        if dims is None and os.path.isfile(p) and RASTER.search(p) or (p and p.endswith('.webp') and os.path.isfile(p)):
            try: dims = Image.open(p).size
            except Exception: dims = None
        out = tag
        if dims and 'width=' not in tag:
            out = out[:-1].rstrip('/') + f' width="{dims[0]}" height="{dims[1]}">'
        seen_first['n'] += 1
        above_fold = seen_first['n'] <= 2 or 'fetchpriority' in tag or 'detail-hero__logo' in tag or 'hero__portrait' in tag
        if 'loading=' not in out and not above_fold:
            out = out[:-1] + ' loading="lazy" decoding="async">'
        elif 'loading=' not in out and 'decoding=' not in out:
            out = out[:-1] + ' decoding="async">'
        return out
    return IMG_TAG.sub(sub, txt)

for page in HTML:
    txt = open(page, encoding='utf-8').read()
    new = rewrite_refs(page, txt)
    new = gif_to_video(page, new)
    new = add_dims(page, new)
    if new != txt and not DRY:
        open(page, 'w', encoding='utf-8').write(new)
        print('rewrote', page)

# also rewrite references inside CSS files that point at images
for css in glob.glob('**/*.css', recursive=True):
    txt = open(css, encoding='utf-8').read()
    new = rewrite_refs(css, txt)
    if new != txt and not DRY:
        open(css, 'w', encoding='utf-8').write(new); print('rewrote', css)
