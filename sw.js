const CACHE_NAME = 'sadiyah-pwa-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  const url = e.request.url;

  // Jika request ke Google Apps Script (Backend Database)
  if (url.includes('script.google.com')) {
    e.respondUrl = e.request;
    e.respondWith(
      fetch(e.request)
        .then(function(response) {
          // Clone respons dan simpan ke Cache API agar bisa dibaca saat offline
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          // Jika offline, ambil data terakhir dari cache
          return caches.match(e.request).then(function(cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback jika belum pernah dicache sama sekali
            return new Response(JSON.stringify({ 
              ok: false, 
              message: 'Mode Offline: Menggunakan data lokal terakhir.' 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Untuk aset statis (HTML, CSS, CDN)
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});
