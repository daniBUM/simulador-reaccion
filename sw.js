// Service worker: la app abre sin conexion y guarda los casos ya vistos.
const SHELL = 'sim-shell-eb71df56d0', CASOS = 'sim-casos-v2';   // v2: casos de 4 h (cambia el nombre para no reutilizar los de 2 h)
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'casos/indice.json', 'iconos/icono-192.png', 'iconos/icono-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.startsWith('sim-shell-') && k !== SHELL) || (k.startsWith('sim-casos-') && k !== CASOS)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (/\/casos\/c\d+\.json$/.test(url.pathname)) {          // los casos no cambian: primero la cache
    e.respondWith(caches.open(CASOS).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  // la app: primero la red y sin la cache de 10 min de GitHub Pages, para recibir las mejoras al momento
  e.respondWith(fetch(url.href, { cache:'no-cache', credentials:'same-origin' }).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html'))));
});
