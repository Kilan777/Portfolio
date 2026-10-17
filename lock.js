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

    /* media is fetched and decrypted only as it nears the viewport */
    var decryptMedia = function (key, scope) {
        var els = scope.querySelectorAll('[data-enc]');
        if (!('IntersectionObserver' in window)) { els.forEach(function (el) { decryptOne(key, el); }); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                io.unobserve(e.target);
                decryptOne(key, e.target);
            });
        }, { rootMargin: '1200px 0px' });
        els.forEach(function (el) { io.observe(el); });
    };

    var decryptOne = function (key, el) {
        fetch(el.getAttribute('data-enc'))
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
            .then(function (buf) {
                return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, key, new Uint8Array(buf, 12));
            })
            .then(function (pt) {
                el.src = URL.createObjectURL(new Blob([pt], { type: el.getAttribute('data-type') || '' }));
                if (el.tagName === 'VIDEO' && el.hasAttribute('autoplay')) {
                    var p = el.play();
                    if (p && p.catch) p.catch(function () {});
                }
            })
            .catch(function () { el.classList.add('is-loaded'); });
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
