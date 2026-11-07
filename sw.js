// ═══════════════════════════════════════════════════════════
// James' Ladder — service worker
//
// Strategy is split by asset type, deliberately:
//
//   document / same-origin app files → NETWORK-FIRST, cache as fallback
//   pinned CDN library               → CACHE-FIRST (immutable URL)
//
// The previous version was cache-first for everything with a hard-coded
// cache name. Because CACHE never changed, the activate handler never had
// an old key to evict, and the fetch handler never revalidated — so once a
// user loaded the app they were frozen on that build permanently and no
// subsequent fix could ever reach them. Bump VERSION on release; the
// network-first document path means users get updates even without it.
// ═══════════════════════════════════════════════════════════

const VERSION = 'v16';
const CACHE   = 'james-ladder-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
];

// Immutable, version-pinned third-party asset — safe to serve from cache forever.
const IMMUTABLE = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE.concat(IMMUTABLE)))
      // A single failed CDN fetch must not abort the whole install.
      .catch(() => caches.open(CACHE).then(c => c.addAll(PRECACHE)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Cache-first for the pinned library: the URL encodes its version.
  if (IMMUTABLE.some(u => req.url === u)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Network-first for everything else, so a reload always picks up new code.
  // Falls back to cache when offline, which is what keeps the PWA installable.
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
