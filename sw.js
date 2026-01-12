
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

// ネットワークリクエスト時に実行（オフライン対応の基本）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// プッシュ通知を受け取った時の処理
self.addEventListener('push', (event) => {
  let data = { title: 'Tamarind Connect', body: '新しいお誘いがあります！' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Tamarind Connect', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3661/3661448.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3661/3661448.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知をクリックした時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
