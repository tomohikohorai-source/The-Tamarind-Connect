
// Cache name updated to current app branding
const CACHE_NAME = 'nearby-exchange-cache-v1';

// Execute on install
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

// Execute on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Execute on fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
