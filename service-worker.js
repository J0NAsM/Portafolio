const CACHE_NAME = 'jonas-portfolio-v6';
const BASE_PATH = new URL('./', self.location.href).pathname;
const fromBase = path => `${BASE_PATH}${path}`;
const APP_SHELL = [
  '',
  'index.html',
  'src/data.js',
  'src/main.js',
  'src/fonts.css',
  'src/styles.css',
  'src/visual-evidence.css',
  'src/blog.css',
  'src/visual-system.css',
  'src/improvements.css',
  'src/showcase.css',
  'src/loading.css',
  'public/blog-posts.js',
  // Tipografías auto-alojadas: sin ellas el modo offline perdería la identidad visual.
  'public/fonts/manrope-latin.woff2',
  'public/fonts/manrope-latin-ext.woff2',
  'public/fonts/dm-mono-400-latin.woff2',
  'public/fonts/dm-mono-400-latin-ext.woff2',
  'public/fonts/dm-mono-500-latin.woff2',
  'public/fonts/dm-mono-500-latin-ext.woff2',
  'public/favicon.svg',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/apple-touch-icon.png',
  'public/site.webmanifest',
  'public/privacy.html',
  'public/images/general/work-method.svg',
  'public/images/general/portfolio-lens.svg',
  'public/images/general/blog-organizer.svg',
  'public/images/architecture/portfolio-flow.svg',
  'public/images/architecture/sigbo-flow.svg',
  'public/images/architecture/mbapo-flow.svg',
  'public/images/architecture/bomberos-flow.svg',
  'public/images/architecture/inspecciones-moviles-flow.svg'
].map(fromBase);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(fromBase('index.html'))) || Response.error();
  }
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request);
  const update = fetch(event.request).then(async response => {
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  });

  if (cached) {
    event.waitUntil(update.catch(() => undefined));
    return cached;
  }

  return update.catch(() => Response.error());
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return;
  event.respondWith(event.request.mode === 'navigate' ? networkFirst(event.request) : staleWhileRevalidate(event));
});
