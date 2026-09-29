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
            img.onload = function () { cb && cb(); };
        };
        var mixFor = function (i) {
            if (!fullTpl || i < fullFrom) return 0;
            var span = Math.max(1, n - 1 - fullFrom);
            return Math.min(1, (i - fullFrom) / span);
        };
        var draw = function (i) {
            var img = frames[i];
            if (!img || !img.complete || !img.naturalWidth) return;
            var mix = mixFor(i);
            var full = fulls[i];
            if (mix > 0 && !(full && full.complete && full.naturalWidth)) mix = 0;
            if (canvas.width !== img.naturalWidth) { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; }
            if (i === current && mix === currentMix) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
            ctx.drawImage(img, 0, 0);
            if (mix > 0) { ctx.globalAlpha = mix; ctx.drawImage(full, 0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1; }
            current = i; currentMix = mix;
            canvas.classList.add('is-ready');
        };
        var setCaption = function (i, stackVisible) {
            var step = 0;
            if (!stackVisible) steps.forEach(function (s, k) { if (i >= s) step = k + 1; });
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
        var render = function () {
            var p = progress();
            if (p > 0.01) el.classList.add('is-started');
            if (stack) {
                var sp = stackEnd > 0 ? Math.min(1, p / stackEnd) : 1;
                stack.style.setProperty('--p', String(1 - sp));
                var fade = sp < 0.7 ? 1 : Math.max(0, (1 - sp) / 0.3);   /* stack fades out over the last 30% while the render fades in */
                stack.style.opacity = String(fade);
                stack.classList.toggle('is-hidden', sp >= 1);
                canvas.style.opacity = sp >= 1 ? '' : String(1 - fade);
            }
            var q = stackEnd > 0 ? Math.max(0, (p - stackEnd) / (1 - stackEnd)) : p;
            var i = Math.min(n - 1, Math.floor(q * n));
            setCaption(i, stack && stackEnd > 0 && p < stackEnd);
            var go = function () { draw(i); };
            if (frames[i] && frames[i].complete) {
                if (fullTpl && i >= fullFrom && !(fulls[i] && fulls[i].complete)) loadInto(fulls, fullTpl.replace('{i}', pad3(i)), i, go);
                go();
            } else {
                loadInto(frames, tpl.replace('{i}', pad3(i)), i, go);
            }
        };

        if (reduceMotion) {
            var last = n - 1;
            loadInto(frames, tpl.replace('{i}', pad3(last)), last, function () {
                if (fullTpl) loadInto(fulls, fullTpl.replace('{i}', pad3(last)), last, function () { draw(last); });
                else draw(last);
            });
            setCaption(last, false);
            return;
        }

        /* first frame first, then everything else in order in the background */
        loadInto(frames, tpl.replace('{i}', pad3(0)), 0, function () {
            render();
            var k = 1;
            var next = function () {
                if (k < n) { var i = k++; loadInto(frames, tpl.replace('{i}', pad3(i)), i, next); }
                else if (fullTpl) { fullTpl && (function loadFull(j) { if (j >= n) return; loadInto(fulls, fullTpl.replace('{i}', pad3(j)), j, function () { if (j === current) { currentMix = -1; draw(j); } loadFull(j + 1); }); })(fullFrom); }
            };
            next();
        });
        var ticking = false;
        var onScroll = function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () { render(); ticking = false; });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
    });

    /* debug: ?scroll=N jumps to a scroll offset after load (used for screenshots) */
    var sm = /[?&]scroll=(\d+)/.exec(location.search);
    if (sm) { window.addEventListener('load', function () { setTimeout(function () { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, parseInt(sm[1], 10)); window.dispatchEvent(new Event('scroll')); }, 300); }); }

    /* ---------------- Footer year ---------------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
})();
