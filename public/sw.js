// Service worker minimal: face aplicația instalabilă și servește shell-ul când
// telefonul e offline. NU pune în cache răspunsurile Supabase — datele trebuie
// să rămână proaspete, iar aplicația are deja propriul cache de anunțuri în
// localStorage pentru modul offline.
const CACHE = "vatrio-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Orice iese către alt origin (Supabase, tile-uri OSM, imagini de pe portaluri)
  // merge direct în rețea, fără cache.
  if (url.origin !== self.location.origin) return;

  // Navigările cad pe shell-ul din cache doar dacă rețeaua lipsește, ca o
  // versiune nouă a aplicației să fie preluată imediat ce există conexiune.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html").then((r) => r ?? Response.error())));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        void caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
