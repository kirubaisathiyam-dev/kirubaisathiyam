/* eslint-disable no-restricted-globals */
const VERSION = "v1";
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;
const CONTENT = `content-${VERSION}`;

const CORE_ASSETS = [
  "/",
  "/bible",
  "/articles",
  "/manifest.json",
  "/apple-icon.png",
  "/icon0.svg",
  "/icon1.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/bible-notes.json",
  "/local-bible/Books.json",
];

async function cacheAll(cache, paths) {
  const unique = Array.from(new Set(paths)).filter(Boolean);
  await Promise.all(
    unique.map(async (path) => {
      try {
        const response = await fetch(path, { cache: "no-cache" });
        if (response && response.ok) {
          await cache.put(path, response.clone());
        }
      } catch {
        // Ignore individual failures so install can continue.
      }
    }),
  );
}

async function warmContentCache() {
  try {
    const response = await fetch("/pwa-precache.json", { cache: "no-cache" });
    if (!response.ok) return;
    const data = await response.json();
    const routes = [
      ...(Array.isArray(data.articles) ? data.articles : []),
      ...(Array.isArray(data.bibleBooks) ? data.bibleBooks : []),
    ];
    const cache = await caches.open(CONTENT);
    await cacheAll(cache, routes);
  } catch {
    // no-op
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(CORE_ASSETS);
      await warmContentCache();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key === PRECACHE || key === RUNTIME || key === CONTENT) {
            return null;
          }
          return caches.delete(key);
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw new Error("Offline and no cache.");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const pathname = url.pathname;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, RUNTIME, "/"));
    return;
  }

  if (pathname.startsWith("/local-bible/") || pathname === "/bible-notes.json") {
    event.respondWith(cacheFirst(request, CONTENT));
    return;
  }

  if (pathname.startsWith("/articles/")) {
    event.respondWith(networkFirst(request, CONTENT, "/articles"));
    return;
  }

  const isStaticAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/uploads/") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".mjs") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".ttf") ||
    pathname.endsWith(".otf");

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request, PRECACHE));
  }
});
