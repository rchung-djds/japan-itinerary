// Bump VERSION whenever index.html changes so phones pick up the update.
const VERSION = 'v1';
const CACHE = 'japan-trip-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const PHOTOS = [
  "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1200&q=80",
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    // Photos are nice-to-have; don't fail install if one is unreachable.
    await Promise.all(PHOTOS.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Page: network first so edits show up, fall back to cache offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Everything else (icons, photos): cache first.
  if (url.origin === location.origin || url.hostname === 'images.unsplash.com') {
    e.respondWith(caches.match(req.url).then(hit => hit || fetch(req).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(req.url, copy)); return r;
    })));
  }
});
