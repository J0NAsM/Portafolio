const CACHE_NAME = 'jonas-portfolio-v1';
const APP_SHELL = [
  '/', '/index.html', '/404.html', '/src/data.js', '/src/main.js', '/src/styles.css', '/src/visual-evidence.css', '/src/blog.css', '/src/visual-system.css', '/src/improvements.css', '/src/showcase.css', '/src/loading.css', '/src/log-404.js', '/public/blog-posts.js', '/public/favicon.svg', '/public/site.webmanifest', '/public/privacy.html', '/public/images/general/profile-placeholder.webp'
];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('/index.html') : caches.match('/404.html'))));
});
