/* オフラインでも遊べるようにするための仕組み。
   ゲームを更新したら、下の VERSION の数字を変えると確実に新しい版へ切り替わる */
const VERSION = 'mujirushi-13f4c44';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === self.location.origin;
  if (sameOrigin) {
    // ゲーム本体：つながるときは最新を取り、つながらないときは保存ずみの版を使う
    e.respondWith(fetch(e.request).then(function (res) {
      const copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); return res;
    }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); }); }));
  } else {
    // 文字のフォントなど：一度取ったものを使いまわす
    e.respondWith(caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) { const copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); return res; });
    }));
  }
});
