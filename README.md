# kilanrou.com

Personal engineering portfolio of Kilan Rougeot. Plain HTML/CSS/JS, no build step, hosted on GitHub Pages (custom domain in `CNAME`).

## Layout

```
index.html            home: hero, experience, teams, projects
contact.html          contact form (Formspree) + details
404.html              custom not-found page
feed.html             legacy redirect → projects/munchkin.html
styles.css            THE design system: every page uses only this file
script.js             shared behaviour: nav, reveal-on-scroll, lightbox, lazy YouTube, tabs
experience/*.html     work experience and team pages
projects/*.html       project pages
experience/template.html, projects/template.html   copy one of these to start a new page
Pics/                 card images, logos, headshot, og.jpg (social preview)
Files/ResumeKilan.pdf
robots.txt, sitemap.xml, llms.txt   search-engine and AI-crawler files
```

## Adding a page

1. Copy `projects/template.html` (or `experience/template.html`) to a new file and follow the comments inside. Keep to the components already in `styles.css` (`.media`, `.media-row`, `.features`, `.stats`, `.video.yt`, `.callout`, `.table`, `.tabs` …). Don't add page-level `<style>` blocks or inline styles.
2. Put images in a folder next to the page (e.g. `projects/foo-pics/`). Any size is fine; then run the optimizer (below) which converts them to WebP, resizes, and adds `width/height/loading` attributes.
3. Add a tile to `index.html` (copy an existing `<a class="tile">`), a `<url>` to `sitemap.xml`, and a line to `llms.txt`.
4. Fill in `<title>`, `<meta name="description">`, `<link rel="canonical">` and the JSON-LD block. These are what Google and AI crawlers read.

## Image optimizer

Images referenced from HTML are stored as WebP (max 1600 px wide for content, 900 px for cards, 400 px for logos). GIFs become muted looping MP4s. To process new images, run from the repo root:

```
python3 tools/optimize_media.py        # needs Pillow; ffmpeg only for GIFs
```

It rewrites the `src` references for you and deletes the originals from the working tree (they stay in git history).

## Design rules

- Quiet and plain: warm off-white page (`--bg`), near-black text, slate-blue headings and buttons (`--accent`), hairlines instead of boxes.
- Home page: wide fluid container (up to 1600 px), underline section titles, hover cards (`.card`) with the org logo always visible; two cards per row on phones.
- Detail pages: 1280 px container, 880 px text column, figures widen to 1100 px on desktop. Every page follows the same order: hero, one lead image or video, lede, Overview, body sections, What I learned, back link. Everything must work at 390 px wide with no horizontal scroll.
- Copy is factual first-person engineering writing. No taglines, no superlatives, at most four "pills" per page, stats only for real measured numbers.
- System font stack. Motion is subtle: fade on scroll, `prefers-reduced-motion` respected.

## Third-party services

- Contact form: Formspree endpoint in `contact.html` (`action="https://formspree.io/f/…"`).
- Analytics: Google Analytics 4 tag (`G-KL9QFYJ377`) in every page head.
- YouTube embeds load only on click or when scrolled into view (`.video.yt`), via youtube-nocookie.com.
