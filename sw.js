// Service Worker para permitir instalación como PWA y funcionamiento fluido
const CACHE_NAME = 'objetivos-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './config.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first con fallback a cache para asegurar datos frescos
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  // No cachear llamadas directas a Supabase
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});
