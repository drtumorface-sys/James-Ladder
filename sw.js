// ═══════════════════════════════════════════════════════════
// James' Ladder — service worker
//
// Everything the app needs ships with it: Three.js in vendor/, the fonts in
// fonts/. Nothing is fetched from another server, so the app starts offline
// and works the same inside an App Store / Play Store wrapper.
//
//   app files (index.html, privacy.html…) → NETWORK-FIRST, cache as fallback
//   vendor/ and fonts/                    → CACHE-FIRST (they never change)
//
// Network-first for the app means users get updates on the next reload. Bump
// VERSION on release anyway: the activate handler then clears the old cache.
// ═══════════════════════════════════════════════════════════

const VERSION = 'v19';
const CACHE   = 'james-ladder-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './privacy.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './vendor/three.min.js',
  './fonts/fonts.css',
  './fonts/cormorant-latin.woff2',
  './fonts/cormorant-latin-ext.woff2',
  './fonts/cormorant-italic-latin.woff2',
  './fonts/cormorant-italic-latin-ext.woff2',
  './fonts/fira-code-latin.woff2',
  './fonts/fira-code-latin-ext.woff2',
  './fonts/fira-code-symbols2.woff2',
];

// Library files: a new version would get a new file name, so cache them for good.
const STATIC_DIRS = ['/vendor/', '/fonts/'];
function isStatic(url) {
  const u = new URL(url);
  return u.origin === self.location.origin && STATIC_DIRS.some(d => u.pathname.includes(d));
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
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

  if (isStatic(req.url)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  // Network-first for the app itself, so a reload always picks up new code.
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
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || caches.match('./index.html')))
  );
});
