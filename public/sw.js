const VERSION = "v2";
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
];

function getCacheName(pathname) {
  if (pathname.startsWith("/_next/")) {
    return PRECACHE;
  }

  if (
    pathname === "/bible-notes.json" ||
    pathname.startsWith("/local-bible/") ||
    pathname.startsWith("/articles/") ||
    pathname.startsWith("/theology/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/images/")
  ) {
    return CONTENT;
  }

  return RUNTIME;
}

async function cachePath(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response || !response.ok) {
    return;
  }

  const cache = await caches.open(getCacheName(new URL(path, self.location.origin).pathname));
  await cache.put(path, response.clone());
}

async function cacheAll(paths) {
  const unique = Array.from(new Set(paths)).filter(Boolean);
  await Promise.all(
    unique.map(async (path) => {
      try {
        await cachePath(path);
      } catch {
        // Ignore individual failures so install can continue.
      }
    }),
  );
}

async function readOfflineManifest() {
  try {
    const response = await fetch("/pwa-precache.json", { cache: "no-cache" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function warmContentCache() {
  const manifest = await readOfflineManifest();
  if (!manifest) {
    return;
  }

  const routes = Array.isArray(manifest.routes) ? manifest.routes : [];
  const bibleBooks = Array.isArray(manifest.bibleBooks) ? manifest.bibleBooks : [];
  const contentAssets = Array.isArray(manifest.contentAssets)
    ? manifest.contentAssets
    : [];

  await cacheAll([...routes, ...bibleBooks, ...contentAssets]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await cacheAll(CORE_ASSETS);
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

function isRangeRequest(request) {
  return request.headers.has("range");
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    if (response.status === 206 || isRangeRequest(request)) {
      return response;
    }
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  const noCacheRequest = new Request(request, { cache: "no-cache" });
  try {
    const response = await fetch(noCacheRequest);
    if (response && response.ok) {
      if (response.status === 206 || isRangeRequest(request)) {
        return response;
      }
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
    const fallbackUrl = pathname.startsWith("/articles/")
      ? "/articles"
      : pathname.startsWith("/theology/")
        ? "/theology"
        : pathname === "/bible"
          ? "/bible"
          : pathname === "/privacy-terms"
            ? "/privacy-terms"
            : "/";

    event.respondWith(networkFirst(request, getCacheName(pathname), fallbackUrl));
    return;
  }

  const isDynamicContent =
    pathname === "/bible-notes.json" || pathname.startsWith("/local-bible/");

  if (isDynamicContent) {
    event.respondWith(networkFirst(request, CONTENT));
    return;
  }

  if (pathname.startsWith("/articles/")) {
    event.respondWith(networkFirst(request, CONTENT, "/articles"));
    return;
  }

  if (pathname.startsWith("/theology/")) {
    event.respondWith(networkFirst(request, CONTENT, "/theology"));
    return;
  }

  const isNextData = pathname.startsWith("/_next/data/");
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
    pathname.endsWith(".mp3") ||
    pathname.endsWith(".wav") ||
    pathname.endsWith(".ogg") ||
    pathname.endsWith(".aac") ||
    pathname.endsWith(".m4a") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".ttf") ||
    pathname.endsWith(".otf");

  if (pathname.startsWith("/uploads/")) {
    event.respondWith(cacheFirst(request, CONTENT));
    return;
  }

  if (isStaticAsset || isNextData) {
    event.respondWith(cacheFirst(request, getCacheName(pathname)));
  }
});
