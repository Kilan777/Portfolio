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
        '.section__head', '.grid > .tile', '.prose > h2', '.prose > .media', '.prose > .media-row',
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
                    parent.classList.contains('features') || parent.classList.contains('media-row'))) {
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

    /* ---------------- Footer year ---------------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
})();
