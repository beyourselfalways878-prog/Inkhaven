/* eslint-env serviceworker */
// Clean, Minimal Service Worker for WebRTC Architecture
// This replaces the old database-heavy service worker and clears its queues.

const CACHE_NAME = 'inkhaven-chat-v3.0.0'

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Clear the old IndexedDB queues that were causing 500/405 errors
      indexedDB.deleteDatabase('InkhavenOfflineDB');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin requests. Let third-party requests
  // (Sentry, Supabase, AdSense, etc.) pass through natively.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return; // Don't call respondWith — browser handles it natively
  }
  event.respondWith(fetch(event.request));
});

// --- Web Push Notification Handlers ---

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'InkHaven';
    const options = {
      body: data.body || 'You have a new message',
      icon: '/favicon.ico', // Update with real icon path if available
      badge: '/favicon.ico',
      data: data.data || { url: '/' },
      vibrate: [200, 100, 200],
      requireInteraction: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Service Worker: Error parsing push payload', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  // Opens the URL or focuses the window if it's already there
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});