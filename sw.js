const CACHE_NAME = "negative-lab-converter-v4";
const OFFLINE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/app-icon.svg",
  "./vendor/pako/pako.min.js",
  "./vendor/utif/UTIF.js",
  "./vendor/libheif/libheif-bundle.js",
  "./vendor/libheif/libheif-bundle.mjs",
  "./vendor/libheif/libheif.js",
  "./vendor/libheif/libheif.wasm",
  "./vendor/libraw/index.js",
  "./vendor/libraw/libraw.js",
  "./vendor/libraw/libraw.wasm",
  "./vendor/libraw/worker.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response.ok || response.type !== "basic") {
            return response;
          }

          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
