const CACHE_PREFIX = "rituals";
const CACHE_NAME = `${CACHE_PREFIX}-__BUILD_ID__`;

const SCOPE_URL = new URL(".", self.registration.scope);
const ASSETS_TO_PRECACHE = [
  SCOPE_URL.href,
  new URL("./index.html", SCOPE_URL).href,
  new URL("./manifest.json", SCOPE_URL).href,
  new URL("./icon-192.png", SCOPE_URL).href,
  new URL("./icon-512.png", SCOPE_URL).href,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(ASSETS_TO_PRECACHE.map((url) => cache.add(url)))
      )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await cache.match(new URL("./index.html", SCOPE_URL).href));
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.status === 200 && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
