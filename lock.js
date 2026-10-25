/* Password lock for NDA pages.

   The page ships only ciphertext (built by tools/lock_page.py):
     <div data-lock> … the password form … </div>
     <script type="application/json" id="lock-data">{"v":1,"salt","iter","iv","ct"}</script>
     <script src="../lock.js" data-main="../script.js?v=…"></script>
   Content is AES-256-GCM with key = PBKDF2-SHA256(password, salt, iter). Images and
   videos inside it carry data-enc="file.bin" (12-byte IV + ciphertext) and data-type,
   and are decrypted to blob URLs.

   script.js is loaded only once the page is settled, so its reveal / lightbox /
   video hooks see the unlocked content. Unlocking saves the key for the tab
   (sessionStorage) and reloads, so the page comes up unlocked from the start. */
(function () {
    var me = document.currentScript;
    var root = document.querySelector('[data-lock]');
    var dataEl = document.getElementById('lock-data');
    var KEY_NAME = 'lock:' + location.pathname;
    var mainLoaded = false;

    var loadMain = function () {
        if (mainLoaded || !me) return;
        mainLoaded = true;
        var s = document.createElement('script');
        s.src = me.getAttribute('data-main');
        document.body.appendChild(s);
    };

    if (!root || !dataEl || !window.crypto || !crypto.subtle) { loadMain(); return; }

    var b64 = function (s) {
        var bin = atob(s), out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    };
    var toB64 = function (buf) {
        var bytes = new Uint8Array(buf), s = '';
        for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return btoa(s);
    };
    var store = {
        get: function () { try { return sessionStorage.getItem(KEY_NAME); } catch (e) { return null; } },
        set: function (v) { try { sessionStorage.setItem(KEY_NAME, v); return sessionStorage.getItem(KEY_NAME) === v; } catch (e) { return false; } },
        clear: function () { try { sessionStorage.removeItem(KEY_NAME); } catch (e) {} }
    };

    var payload = JSON.parse(dataEl.textContent);

    var decryptText = function (key) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(payload.iv) }, key, b64(payload.ct))
            .then(function (pt) { return new TextDecoder().decode(pt); });
    };

    var deriveKey = function (password) {
        return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
            .then(function (base) {
                return crypto.subtle.deriveKey(
                    { name: 'PBKDF2', salt: b64(payload.salt), iterations: payload.iter, hash: 'SHA-256' },
                    base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
            });
    };

    /* Media is fetched and decrypted only as it nears the viewport, at most
       four files at a time so what is on screen comes first. Images carry a
       small (data-enc) and, when it differs, a large (data-enc-lg) file; the
       large one is used when the image is shown wide, and for the lightbox.
       Videos show their small poster early and fetch the clip when close. */
    var queue = [], active = 0, MAX_ACTIVE = 4;
    var pump = function () {
        while (active < MAX_ACTIVE && queue.length) {
            var job = queue.shift();
            active++;
            job().then(done, done);
        }
    };
    var done = function () { active--; pump(); };
    var enqueue = function (job, urgent) {
        return new Promise(function (resolve, reject) {
            var run = function () { return job().then(resolve, reject); };
            if (urgent) queue.unshift(run); else queue.push(run);
            pump();
        });
    };

    var blobUrl = function (key, url, type) {
        return fetch(url)
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
            .then(function (buf) {
                return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, key, new Uint8Array(buf, 12));
            })
            .then(function (pt) { return URL.createObjectURL(new Blob([pt], { type: type || '' })); });
    };

    var wantsLarge = function (el) {
        var w = el.getBoundingClientRect().width || (el.parentNode && el.parentNode.getBoundingClientRect().width) || 0;
        return w * Math.min(window.devicePixelRatio || 1, 2) > 760;
    };

    var loadImage = function (key, el) {
        var lg = el.getAttribute('data-enc-lg');
        var url = lg && wantsLarge(el) ? lg : el.getAttribute('data-enc');
        if (url === lg) el.removeAttribute('data-enc-lg');
        return enqueue(function () {
            return blobUrl(key, url, el.getAttribute('data-type')).then(function (src) { el.src = src; });
        }).catch(function () { el.classList.add('is-loaded'); });
    };

    /* lightbox: swap in the large file once it is decrypted */
    var upgradeImage = function (key, el) {
        var lg = el.getAttribute('data-enc-lg');
        if (!lg) return;
        el.removeAttribute('data-enc-lg');
        var small = el.src;
        enqueue(function () { return blobUrl(key, lg, el.getAttribute('data-type')); }, true).then(function (src) {
            el.src = src;
            var open = document.querySelector('.lightbox.is-open img');
            if (open && open.src === small) open.src = src;
        }, function () {});
    };

    var loadPoster = function (key, el) {
        var p = el.getAttribute('data-poster-enc');
        if (!p) return;
        enqueue(function () {
            return blobUrl(key, p, 'image/webp').then(function (src) { if (!el.src) el.poster = src; });
        }).catch(function () {});
    };

    var loadVideo = function (key, el) {
        return enqueue(function () {
            return blobUrl(key, el.getAttribute('data-enc'), el.getAttribute('data-type')).then(function (src) {
                el.src = src;
                if (el.hasAttribute('autoplay')) {
                    var r = el.getBoundingClientRect();
                    if (r.bottom > 0 && r.top < window.innerHeight) {
                        var p = el.play();
                        if (p && p.catch) p.catch(function () {});
                    }
                }
            });
        }).catch(function () {});
    };

    var decryptMedia = function (key, scope) {
        var imgs = scope.querySelectorAll('img[data-enc]');
        var vids = scope.querySelectorAll('video[data-enc]');
        imgs.forEach(function (el) {
            el.addEventListener('click', function () { upgradeImage(key, el); });
            el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') upgradeImage(key, el); });
        });
        if (!('IntersectionObserver' in window)) {
            imgs.forEach(function (el) { loadImage(key, el); });
            vids.forEach(function (el) { loadVideo(key, el); });
            return;
        }
        var watch = function (els, margin, fn) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    io.unobserve(e.target);
                    fn(key, e.target);
                });
            }, { rootMargin: margin });
            els.forEach(function (el) { io.observe(el); });
        };
        watch(imgs, '900px 0px', loadImage);
        watch(vids, '1200px 0px', loadPoster);
        watch(vids, '300px 0px', loadVideo);
    };

    var reveal = function (key, html) {
        var t = document.createElement('template');
        t.innerHTML = html;
        var nodes = Array.prototype.slice.call(t.content.children);
        root.replaceWith(t.content);
        nodes.forEach(function (n) { decryptMedia(key, n); });
        document.documentElement.classList.add('is-unlocked');
    };

    var showLock = function () {
        var form = root.querySelector('form');
        var input = form.querySelector('input');
        var btn = form.querySelector('button');
        var err = root.querySelector('.lock__error');
        form.hidden = false;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!input.value) { input.focus(); return; }
            btn.disabled = true;
            btn.textContent = 'Unlocking…';
            err.textContent = '';
            root.classList.remove('is-wrong');
            var key;
            deriveKey(input.value)
                .then(function (k) { key = k; return decryptText(k); })
                .then(function (html) {
                    return crypto.subtle.exportKey('raw', key).then(function (raw) {
                        if (store.set(toB64(raw))) { location.reload(); }
                        else { reveal(key, html); }   /* no storage: unlock in place, without script.js hooks */
                    });
                })
                .catch(function () {
                    btn.disabled = false;
                    btn.textContent = 'Unlock';
                    err.textContent = 'That password is not right.';
                    void root.offsetWidth;
                    root.classList.add('is-wrong');
                    input.select();
                });
        });
        loadMain();
    };

    var saved = store.get();
    if (!saved) { showLock(); return; }
    root.style.visibility = 'hidden';   /* no flash of the lock box while the saved key decrypts */
    crypto.subtle.importKey('raw', b64(saved), { name: 'AES-GCM' }, false, ['decrypt'])
        .then(function (key) { return decryptText(key).then(function (html) { reveal(key, html); }); })
        .then(loadMain)
        .catch(function () { store.clear(); root.style.visibility = ''; showLock(); });
})();
