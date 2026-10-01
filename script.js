/* Shared behaviour for every page: nav, reveal-on-scroll, lightbox,
   lazy YouTube, in-view video playback, tabs. Keep page-specific code in
   the page itself. */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- Navigation ---------------- */
    var nav = document.querySelector('.nav');
    if (nav) {
        var toggle = nav.querySelector('.nav__toggle');
        var setScrolled = function () {
            nav.classList.toggle('is-scrolled', window.scrollY > 8);
        };
        setScrolled();
        window.addEventListener('scroll', setScrolled, { passive: true });

        if (toggle) {
            toggle.addEventListener('click', function () {
                var open = nav.classList.toggle('is-open');
                document.body.classList.toggle('menu-open', open);
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
            nav.querySelectorAll('.nav__link').forEach(function (a) {
                a.addEventListener('click', function () {
                    nav.classList.remove('is-open');
                    document.body.classList.remove('menu-open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
            window.addEventListener('resize', function () {
                if (window.innerWidth > 768 && nav.classList.contains('is-open')) {
                    nav.classList.remove('is-open');
                    document.body.classList.remove('menu-open');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        /* Highlight the section currently in view (home page only) */
        var sections = document.querySelectorAll('main section[id]');
        var links = nav.querySelectorAll('.nav__link[href^="#"]');
        if (sections.length && links.length && 'IntersectionObserver' in window) {
            var current = null;
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { current = e.target.id; }
                });
                links.forEach(function (l) {
                    l.classList.toggle('is-active', l.getAttribute('href') === '#' + current);
                });
            }, { rootMargin: '-40% 0px -55% 0px' });
            sections.forEach(function (s) { spy.observe(s); });
        }
    }

    /* ---------------- Reveal on scroll ---------------- */
    var autoReveal = [
        '.section__head', '.grid > .tile', '.cards > .card', '.prose > h2', '.prose > .media', '.prose > .media-row',
        '.prose > .video', '.prose > .stats', '.prose > .features', '.prose > .resources',
        '.prose > .callout', '.prose > .code', '.prose > .table-wrap', '.prose > .timeline',
        '.detail-lead > *'
    ];
    document.querySelectorAll(autoReveal.join(',')).forEach(function (el) {
        el.classList.add('reveal');
    });
    var revealEls = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window) || /[?&]static\b/.test(location.search)) {
        revealEls.forEach(function (el) { el.classList.add('is-in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var el = e.target;
                /* stagger siblings that enter together */
                var parent = el.parentElement;
                if (parent && (parent.classList.contains('grid') || parent.classList.contains('stats') ||
                    parent.classList.contains('features') || parent.classList.contains('media-row') || parent.classList.contains('cards'))) {
                    var idx = Array.prototype.indexOf.call(parent.children, el);
                    el.style.setProperty('--reveal-delay', Math.min(idx, 8) * 0.07 + 's');
                }
                el.classList.add('is-in');
                io.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealEls.forEach(function (el) {
            /* things already on screen at load should not wait */
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight * 0.9) { el.classList.add('is-in'); }
            else { io.observe(el); }
        });
    }

    /* ---------------- Lightbox ---------------- */
    var zoomables = document.querySelectorAll('.media__frame img:not([data-nozoom]), img[data-zoom]');
    if (zoomables.length) {
        var lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.innerHTML = '<button class="lightbox__close" aria-label="Close">&times;</button><img alt=""><div class="lightbox__caption"></div>';
        document.body.appendChild(lb);
        var lbImg = lb.querySelector('img');
        var lbCap = lb.querySelector('.lightbox__caption');
        var lastFocus = null;

        var closeLb = function () {
            lb.classList.remove('is-open');
            document.body.classList.remove('menu-open');
            if (lastFocus) lastFocus.focus();
        };
        var openLb = function (img) {
            lastFocus = document.activeElement;
            lbImg.src = img.currentSrc || img.src;
            lbImg.alt = img.alt || '';
            var fig = img.closest('figure');
            var cap = fig ? fig.querySelector('figcaption') : null;
            lbCap.textContent = cap ? cap.textContent : (img.alt || '');
            lb.classList.add('is-open');
            document.body.classList.add('menu-open');
            lb.querySelector('.lightbox__close').focus();
        };
        zoomables.forEach(function (img) {
            img.setAttribute('data-zoom', '');
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.addEventListener('click', function () { openLb(img); });
            img.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(img); }
            });
        });
        lb.addEventListener('click', closeLb);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLb();
        });
    }

    /* ---------------- YouTube facade ----------------
       <div class="video yt" data-yt="VIDEO_ID" [data-autoplay]>
           <img class="yt__poster" src="https://i.ytimg.com/vi/ID/hqdefault.jpg" alt="">
           <span class="yt__play"></span>
       </div>                                                                */
    var loadYt = function (el, autoplay) {
        if (el.classList.contains('is-loaded')) return;
        var id = el.getAttribute('data-yt');
        var loop = el.hasAttribute('data-loop') ? '&loop=1&playlist=' + id : '';
        var start = el.getAttribute('data-start') ? '&start=' + el.getAttribute('data-start') : '';
        var params = autoplay
            ? '?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&modestbranding=1' + loop + start
            : '?autoplay=1&rel=0&playsinline=1&modestbranding=1' + loop + start;
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + params;
        iframe.title = el.getAttribute('data-title') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        el.appendChild(iframe);
        el.classList.add('is-loaded');
    };
    var yts = document.querySelectorAll('.yt[data-yt]');
    yts.forEach(function (el) {
        if (!el.querySelector('.yt__poster')) {
            var poster = document.createElement('img');
            poster.className = 'yt__poster';
            poster.alt = '';
            poster.loading = 'lazy';
            poster.src = 'https://i.ytimg.com/vi/' + el.getAttribute('data-yt') + '/hqdefault.jpg';
            el.insertBefore(poster, el.firstChild);
        }
        if (!el.querySelector('.yt__play')) {
            var play = document.createElement('span');
            play.className = 'yt__play';
            el.appendChild(play);
        }
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Play video');
        el.addEventListener('click', function () { loadYt(el, false); });
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadYt(el, false); }
        });
    });
    var autoYts = document.querySelectorAll('.yt[data-yt][data-autoplay]');
    if (autoYts.length && 'IntersectionObserver' in window) {
        var ytIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { loadYt(e.target, true); ytIo.unobserve(e.target); }
            });
        }, { rootMargin: '200px 0px' });
        autoYts.forEach(function (el) { ytIo.observe(el); });
    }

    /* ---------------- Native video: play only while visible ---------------- */
    var vids = document.querySelectorAll('video[autoplay]');
    if (vids.length && 'IntersectionObserver' in window) {
        var vIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var v = e.target;
                if (e.isIntersecting) {
                    var p = v.play();
                    if (p && p.catch) p.catch(function () {});
                } else { v.pause(); }
            });
        }, { threshold: 0.25 });
        vids.forEach(function (v) { vIo.observe(v); });
    }

    /* ---------------- Tabs ----------------
       <div class="tabs" role="tablist"><button class="tab is-active" data-tab="a">…</button></div>
       <div class="tab-panel is-active" id="a">…</div>                          */
    document.querySelectorAll('.tabs').forEach(function (group) {
        var tabs = group.querySelectorAll('.tab[data-tab]');
        tabs.forEach(function (tab) {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', tab.classList.contains('is-active') ? 'true' : 'false');
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) {
                    t.classList.remove('is-active');
                    t.setAttribute('aria-selected', 'false');
                    var p = document.getElementById(t.getAttribute('data-tab'));
                    if (p) p.classList.remove('is-active');
                });
                tab.classList.add('is-active');
                tab.setAttribute('aria-selected', 'true');
                var panel = document.getElementById(tab.getAttribute('data-tab'));
                if (panel) {
                    panel.classList.add('is-active');
                    panel.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('is-in'); });
                }
            });
        });
    });

    /* ---------------- Lazy images fade in ---------------- */
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
        var done = function () { img.classList.add('is-loaded'); };
        if (img.complete && img.naturalWidth > 0) { done(); }
        else { img.addEventListener('load', done); img.addEventListener('error', done); }
    });

    /* ---------------- Page transitions (same-site links) ---------------- */
    if (!reduceMotion) {
        document.body.classList.add('is-entering');
        requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.remove('is-entering'); }); });
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href]');
            if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            if (a.target === '_blank' || a.hasAttribute('download')) return;
            var href = a.getAttribute('href');
            if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/.test(href)) return;
            var url = new URL(a.href, location.href);
            if (url.origin !== location.origin) return;
            if (url.pathname === location.pathname && url.hash) return;
            if (/\.(pdf|zip|png|jpe?g|webp|mp4)$/i.test(url.pathname)) return;
            e.preventDefault();
            document.body.classList.add('is-leaving');
            setTimeout(function () { location.href = url.href; }, 220);
        });
        window.addEventListener('pageshow', function (ev) { if (ev.persisted) document.body.classList.remove('is-leaving'); });
    }


    /* ---------------- Scroll-driven frame sequence ----------------
       <div class="scrolly" data-scrolly data-frames="72" data-src="…/bare/{i}.webp"
            data-full="…/full/{i}.webp" data-full-from="54">
       Frame i of the bare board is shown for scroll progress i/N. From data-full-from on,
       the matching populated frame is blended in, so components appear during the last phase. */
    document.querySelectorAll('[data-scrolly]').forEach(function (el) {
        var canvas = el.querySelector('canvas');
        if (!canvas || !canvas.getContext) return;
        var ctx = canvas.getContext('2d');
        var n = parseInt(el.getAttribute('data-frames'), 10) || 1;
        var tpl = el.getAttribute('data-src');
        var fullTpl = el.getAttribute('data-full');
        var fullFrom = parseInt(el.getAttribute('data-full-from'), 10);
        if (isNaN(fullFrom)) fullFrom = n;
        var frames = new Array(n), fulls = new Array(n);
        var current = -1, currentMix = -1;
        var captions = el.querySelectorAll('.scrolly__caption > span');
        var steps = (el.getAttribute('data-steps') || '').split(',').map(function (v) { return parseInt(v, 10); }).filter(function (v) { return !isNaN(v); });

        var pad3 = function (i) { return String(i).padStart(3, '0'); };
        var loadInto = function (arr, url, i, cb) {
            if (arr[i]) { if (arr[i].complete) cb && cb(); return; }
            var img = new Image();
            img.decoding = 'async';
            img.src = url;
            arr[i] = img;
            var done = function () { cb && cb(); };
            img.onload = function () { if (img.decode) img.decode().then(done, done); else done(); };
            img.onerror = done;
        };
        /* GPU-ready bitmaps: every frame on desktop, a window around the playhead on phones (147 full
           bitmaps is ~400 MB, which iOS Safari will not keep) */
        var lowMem = (navigator.deviceMemory && navigator.deviceMemory < 4) || /iPhone|iPad|iPod|Android/.test(navigator.userAgent) || (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1);
        var bmWin = lowMem ? 20 : n, bmCenter = -999;
        var bitmapsAround = function (c) {
            if (!window.createImageBitmap || Math.abs(c - bmCenter) < 4) return;
            bmCenter = c;
            for (var i = 0; i < n; i++) {
                var img = frames[i]; if (!img || !img.complete || !img.naturalWidth) continue;
                var near = Math.abs(i - c) <= bmWin;
                if (near && !img._bm && !img._bmPending) {
                    img._bmPending = true;
                    (function (im) { createImageBitmap(im).then(function (bm) { im._bmPending = false; if (Math.abs(frames.indexOf(im) - bmCenter) <= bmWin) im._bm = bm; else bm.close(); }, function () { im._bmPending = false; }); })(img);
                } else if (!near && img._bm) { img._bm.close && img._bm.close(); img._bm = null; }
            }
        };
        var mixFor = function (i) {
            if (!fullTpl || i < fullFrom) return 0;
            var span = Math.max(1, n - 1 - fullFrom);
            return Math.min(1, (i - fullFrom) / span);
        };
        var ready = function (img) { return img && img.complete && img.naturalWidth; };
        var src = function (img) { return img._bm || img; };
        var lastDrawn = -1, allIn = false;
        var draw = function (f) {
            if (!allIn) f = 0;   /* hold the first frame until the whole sequence is decoded */
            var a = Math.max(0, Math.min(n - 1, Math.floor(f))), b = Math.min(n - 1, a + 1), t = f - a;
            var A = frames[a], B = frames[b];
            if (!ready(A)) { /* fall back to the nearest decoded frame so the canvas never stalls */
                for (var d = 1; d < n; d++) { if (ready(frames[a - d])) { A = frames[a - d]; break; } if (ready(frames[a + d])) { A = frames[a + d]; break; } }
                if (!ready(A)) return; t = 0;
            }
            if (canvas.width !== A.naturalWidth) { canvas.width = A.naturalWidth; canvas.height = A.naturalHeight; }
            var key = Math.round(f * 100);
            if (key === lastDrawn) return; lastDrawn = key;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (t > 0.02 && t < 0.98 && ready(B) && B !== A) {
                /* additive cross-fade: A*(1-t) + B*t is an exact mix, so shadows and edges never double up */
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 1 - t; ctx.drawImage(src(A), 0, 0);
                ctx.globalAlpha = t; ctx.drawImage(src(B), 0, 0);
                ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
            } else {
                ctx.globalAlpha = 1; ctx.drawImage(src(t >= 0.98 && ready(B) ? B : A), 0, 0);
            }
            current = a; canvas.classList.add('is-ready');
        };
        var setCaption = function (i, stackVisible) {
            var step = 0;
            if (!stackVisible) steps.forEach(function (s, k) { if (i >= s) step = k + 1; });
            if (el.hasAttribute('data-reverse')) { step = captions.length - 1; if (!stackVisible) { step = 0; steps.forEach(function (s, k) { if (i > s) step = k + 1; }); } }
            captions.forEach(function (c, k) { c.classList.toggle('is-active', k === Math.min(step, captions.length - 1)); });
        };
        var progress = function () {
            var r = el.getBoundingClientRect();
            var total = r.height - window.innerHeight;
            if (total <= 0) return 1;
            return Math.min(1, Math.max(0, -r.top / total));
        };
        var stack = el.querySelector('.stack');
        var stackEnd = parseFloat(el.getAttribute('data-stack-until')) || 0;
        var live = el.querySelector('.screen-live');
        var liveFrom = parseInt(el.getAttribute('data-live-from'), 10);
        var liveFull = parseInt(el.getAttribute('data-live-full'), 10); if (isNaN(liveFull)) liveFull = liveFrom;
        var liveQuad = null;
        try { liveQuad = JSON.parse(el.getAttribute('data-live-quad') || 'null'); } catch (e) { liveQuad = null; }
        /* homography from the 1280x720 screen to the quad (in frame pixels), then scaled to the displayed canvas */
        var placeLive = function () {
            if (!live || !liveQuad) return;
            var r = canvas.getBoundingClientRect(); var k = r.width / canvas.width;
            var q = liveQuad.map(function (p) { return [p[0] * k, p[1] * k]; });
            var sw = 1280, sh = 720;
            var src = [[0, 0], [sw, 0], [sw, sh], [0, sh]];
            var A = [], B = [];
            for (var i = 0; i < 4; i++) {
                var x = src[i][0], y = src[i][1], u = q[i][0], v = q[i][1];
                A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u);
                A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v);
            }
            var hgh = solve8(A, B); if (!hgh) return;
            var m = [hgh[0], hgh[3], 0, hgh[6], hgh[1], hgh[4], 0, hgh[7], 0, 0, 1, 0, hgh[2], hgh[5], 0, 1];
            live.style.transform = 'matrix3d(' + m.join(',') + ')';
        };
        var solve8 = function (A, B) {
            var n = 8, M = A.map(function (row, i) { return row.concat([B[i]]); });
            for (var c = 0; c < n; c++) {
                var piv = c; for (var r2 = c + 1; r2 < n; r2++) if (Math.abs(M[r2][c]) > Math.abs(M[piv][c])) piv = r2;
                if (Math.abs(M[piv][c]) < 1e-12) return null;
                var t = M[c]; M[c] = M[piv]; M[piv] = t;
                for (var r3 = 0; r3 < n; r3++) { if (r3 === c) continue; var f = M[r3][c] / M[c][c]; for (var k2 = c; k2 <= n; k2++) M[r3][k2] -= f * M[c][k2]; }
            }
            return M.map(function (row, i) { return row[n] / row[i]; });
        };
        var tickLive = function () {
            if (!live) return;
            var d = new Date();
            var t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
            var parts = t.replace(/\u202f/g, ' ').split(' ');
            live.querySelector('.screen-live__clock').innerHTML = parts[0] + '<span>' + (parts[1] || '') + '</span>';
            live.querySelector('.screen-live__date').textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        };
        if (live) { tickLive(); setInterval(tickLive, 1000); placeLive(); }
        var stage = el.querySelector('.scrolly__stage');
        var sizeStack = function () {
            if (!stack || !stage) return;
            var w = stage.getBoundingClientRect().width || 900;
            stack.style.setProperty('--persp', (w * 1.1357) + 'px');   /* fitted: perspective = 1.0157 x stage width */
            stack.style.setProperty('--unit', (w / 900) + 'px');
        };
        sizeStack();
        var reverse = el.hasAttribute('data-reverse');
        var target = 0, head = -1, running = false;
        var render = function () {
            var p = progress();
            if (p > 0.01) el.classList.add('is-started');
            /* in reverse mode the layer stack lives in the LAST stackEnd fraction of the scroll */
            var ps = reverse ? (1 - p) : p;
            if (stack) {
                var sp = stackEnd > 0 ? Math.min(1, ps / stackEnd) : 1;
                if (sp >= 1 && stack._done) { /* nothing to update while the stack is out of play */ } else {
                stack._done = sp >= 1;
                stack.style.setProperty('--p', String(1 - sp));
                var fadeIn = sp < 0.7 ? 0 : Math.min(1, (sp - 0.7) / 0.3);
                stack.style.opacity = sp >= 1 ? '0' : '1';
                stack.classList.toggle('is-hidden', sp >= 1);
                canvas.style.opacity = sp >= 1 ? '' : String(fadeIn);
                }
            }
            var q = stackEnd > 0 ? Math.max(0, (ps - stackEnd) / (1 - stackEnd)) : ps;
            if (reverse) q = 1 - q;
            target = q * (n - 1);
            if (head < 0) head = target;
            var i = allIn ? Math.round(head) : 0;
            setCaption(i, stack && stackEnd > 0 && ps < stackEnd);
            if (live) {
                placeLive();
                var on = !isNaN(liveFrom) && (reverse ? i <= liveFrom : i >= liveFrom);
                live.classList.toggle('is-on', on);
                if (on) live.style.setProperty('--live-a', String(reverse ? Math.min(1, (liveFrom - i + 1) / Math.max(1, liveFrom - liveFull + 1)) : Math.min(1, (i - liveFrom + 1) / Math.max(1, liveFull - liveFrom + 1))));
            }
            if (allIn) bitmapsAround(Math.round(head));
            draw(head);
        };
        if (reduceMotion) {
            var last = el.hasAttribute('data-reverse') ? 0 : n - 1;
            loadInto(frames, tpl.replace('{i}', pad3(last)), last, function () {
                if (fullTpl) loadInto(fulls, fullTpl.replace('{i}', pad3(last)), last, function () { draw(last); });
                else draw(last);
            });
            setCaption(last, false);
            return;
        }

        /* preload: the first frame shows at once, the rest download and decode on page entry, and
           scrubbing starts only once every frame is in memory (a thin bar shows progress meanwhile) */
        var bar = document.createElement('div'); bar.className = 'scrolly__loader'; bar.innerHTML = '<span></span>';
        if (stage) stage.appendChild(bar);
        var got = 0;
        var oneIn = function () {
            got++; bar.firstChild.style.transform = 'scaleX(' + (got / n) + ')';
            if (got === n) { allIn = true; bar.classList.add('is-done'); lastDrawn = -1; head = target; onScroll(); }
        };
        loadInto(frames, tpl.replace('{i}', pad3(0)), 0, function () {
            render(); oneIn();
            var k = 1;
            var next = function () { if (k < n) { var i = k++; loadInto(frames, tpl.replace('{i}', pad3(i)), i, function () { oneIn(); next(); }); } };
            for (var c = 0; c < 8; c++) next();   /* eight parallel loaders */
        });
        /* eased playhead: follows the scroll position smoothly instead of jumping frame to frame */
        var tick = function () {
            render();
            var d = target - head;
            if (Math.abs(d) < 0.01) { head = target; draw(head); running = false; return; }
            head += d * 0.14;
            requestAnimationFrame(tick);
        };
        var onScroll = function () {
            if (running) return;
            running = true; requestAnimationFrame(tick);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () { sizeStack(); onScroll(); });
    });

    /* debug: ?scroll=N jumps to a scroll offset after load (used for screenshots) */
    var sm = /[?&]scroll=(\d+)/.exec(location.search);
    if (sm) { window.addEventListener('load', function () { setTimeout(function () { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, parseInt(sm[1], 10)); window.dispatchEvent(new Event('scroll')); }, 300); }); }

    /* ---------------- Footer year ---------------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
})();
