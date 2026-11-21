/* Suivi Taxi : fonctionnement hors connexion.
   Pour publier une nouvelle version de l'appli, change simplement le numéro ci-dessous. */
const VERSION = 'suivi-taxi-v1';
const FICHIERS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/icon-180.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord pour la page (toujours la dernière version si connecté), cache sinon.
// Cache d'abord pour le reste (icônes...).
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const estPage = req.mode === 'navigate' || req.destination === 'document';
  if (estPage) {
    e.respondWith(
      fetch(req)
        .then((rep) => { const copie = rep.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copie)); return rep; })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
  } else {
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((rep) => {
        const copie = rep.clone(); caches.open(VERSION).then((c) => c.put(req, copie)); return rep;
      }))
    );
  }
});
