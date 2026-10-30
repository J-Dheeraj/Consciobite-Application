// NOTE: this worker is currently not registered anywhere in the app. It is
// kept correct so that registering it later cannot poison the cache.
const CACHE_NAME = "consciobite-v2";
const STATIC_ASSETS = ["/", "/index.html"];

// Only a successful, same-origin, basic response is worth storing. Caching an
// error (or an opaque cross-origin response) would pin a 404 for every later
// visit, because reads below prefer the cache.
function isCacheable(response) {
  return response && response.ok && response.type === "basic";
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // API and navigations: network-first, so a deploy or a recovered backend is
  // picked up immediately and a stale error is never served in preference to
  // a live response. Cache is only a fallback for offline.
  if (request.url.includes("/api/") || request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .then((response) => response)
        .catch(() => caches.match(request))
    );
    return;
  }

  // Hashed build assets: cache-first is safe because their URLs change on
  // every deploy.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (isCacheable(response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
