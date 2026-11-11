/*
 * Service worker di Forge: rende l'app installabile e consultabile offline.
 * - Pagina: rete prima, copia salvata se offline.
 * - File dell'app (/assets, hash nel nome), icone, dati del bestiario e font: copia salvata prima, aggiornata in background.
 * - Firebase (login e database) non passa di qui: i dati dei personaggi restano disponibili grazie alla cache offline di Firestore.
 */
const VERSION = 'forge-v1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const BASE = new URL('./', self.location).pathname;

/** File dell'app citati in index.html (nomi con hash, cambiano a ogni pubblicazione). */
async function precacheShell() {
  const cache = await caches.open(SHELL);
  const res = await fetch(BASE, { cache: 'no-cache' });
  if (!res.ok) throw new Error('index non disponibile');
  const html = await res.clone().text();
  await cache.put(BASE, res);
  const assets = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), m => m[1])
    .filter(u => u.startsWith(`${BASE}assets/`) || u.startsWith(`${BASE}icons/`) || u.endsWith('.webmanifest'));
  const runtime = await caches.open(RUNTIME);
  await Promise.all(assets.map(u => runtime.add(u).catch(() => undefined)));
}

self.addEventListener('install', event => {
  event.waitUntil(precacheShell().catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = url => url.origin === self.location.origin && url.pathname.startsWith(BASE)
  && /\/(assets|icons|data)\//.test(url.pathname);
const isFont = url => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || network;
}

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(BASE, res.clone());
    return res;
  } catch {
    return (await cache.match(BASE)) || (await cache.match(request)) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(networkFirstPage(request));
  } else if (isStatic(url) || isFont(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  // L'app segnala i file già scaricati prima che il service worker fosse attivo (es. parti caricate su richiesta)
  if (event.data && event.data.type === 'cache-urls' && Array.isArray(event.data.urls)) {
    const urls = event.data.urls.filter(u => { try { return isStatic(new URL(u)) || isFont(new URL(u)); } catch { return false; } });
    event.waitUntil(caches.open(RUNTIME).then(cache => Promise.all(urls.map(async u => { if (!(await cache.match(u))) await cache.add(u).catch(() => undefined); }))));
  }
});
