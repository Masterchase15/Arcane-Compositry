/**
 * sw.js - the service worker that makes the site installable as a web app
 * and keeps the rules readable when the connection drops.
 *
 * Strategy: "network first". Every page load asks the server for the newest
 * files; a saved copy is only used when the server cannot be reached. That
 * means edits you make always show up on refresh - there is no stale cache
 * to clear.
 *
 * Accounts, characters and saving (/api/...) always need the server and are
 * never cached.
 */
const CACHE = 'arcane-compositry-v2'; // bump to drop every older saved copy

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  // Only the spell, item and class lists are kept for offline reading; everything else under /api is live-only.
  if (url.pathname.startsWith('/api/') && !['/api/spells', '/api/items', '/api/classes', '/api/components'].includes(url.pathname)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(request, copy.clone());
            // Every page address (/spells, /codex/...) is the same app: keep one copy to open offline.
            if (request.mode === 'navigate') cache.put('/index.html', copy);
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((hit) => hit || (request.mode === 'navigate' ? caches.match('/index.html') : Response.error()))
      )
  );
});
