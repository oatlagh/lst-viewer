/* LST Viewer – Service Worker des Laders.
 * Liefert die im Browser entschlüsselten App-Dateien (Cache „lst-app“) unter app/… aus
 * und hält den Lader selbst für den Offline-Start vor. */
const SHELL = 'lst-loader-1', APP = 'lst-app';
const BASE = new URL('./', self.location).href;
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (!url.href.startsWith(BASE)) return;
  const rel = url.href.slice(BASE.length).split('#')[0];
  if (rel.startsWith('app/')) {
    const key = BASE + rel.split('?')[0];
    e.respondWith(caches.open(APP).then(c => c.match(key)).then(r => r || Response.redirect(BASE + 'index.html', 302)));
    return;
  }
  if (rel.startsWith('bundle.')) return; // Paket immer frisch vom Netz
  e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(SHELL).then(c => c.put(req, cp)); } return r; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match(BASE + 'index.html'))));
});
