const CACHE_NAME = 'app-cache-v6';
const urlsToCache = [
  '../index.html',
  '../styles.css',
  '../app.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierto, añadiendo archivos...');
        // Añadir uno por uno para que un solo archivo faltante no aborte la instalación entera de la PWA
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(new Request(url, {cache: 'reload'})))
        );
      })
      .catch(err => console.error('[SW] Error al cachear:', err))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
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
