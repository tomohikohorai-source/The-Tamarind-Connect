
// キャッシュの名前
const CACHE_NAME = 'tamarind-cache-v1';

// インストール時に実行
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// 有効化された時に実行
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ネットワークリクエスト時に実行
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
