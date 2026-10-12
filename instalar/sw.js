const CACHE_NAME = 'app-cache-v7';
const urlsToCache = [
  '../index.html',
  '../styles.css',
  '../app.js',
  '../src/js/main.js',
  '../src/js/App.js',
  '../src/js/StorageManager.js',
  '../src/js/TalentManager.js',
  '../src/js/UIController.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(new Request(url, { cache: 'reload' })))
        );
      })
      .catch(err => console.error('[SW] Error al cachear:', err))
  );
});

// Network-First para HTML y llamadas a la API (siempre datos frescos al abrir la app)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NUNCA cachear llamadas a la API de Neon/Netlify
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network First con fallback a Cache para que los usuarios siempre reciban la última versión
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando cache viejo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
