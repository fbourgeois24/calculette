// Garde la calculette disponible hors ligne.
const CACHE = 'calculette-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Polices : mises en cache au premier passage en ligne
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  // Fichiers de l'appli : réseau d'abord (pour recevoir les mises à jour), sinon le cache
  e.respondWith(
    fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
  );
});
