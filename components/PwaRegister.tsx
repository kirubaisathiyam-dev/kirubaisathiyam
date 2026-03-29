"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";
const CACHE_NAMES = {
  precache: "precache-v2",
  runtime: "runtime-v2",
  content: "content-v2",
} as const;
const OFFLINE_MANIFEST_VERSION_KEY = "kirubai-offline:manifest-version";
const OFFLINE_LAST_SYNC_KEY = "kirubai-offline:last-sync";
const CORE_SYNC_URLS = [
  "/",
  "/articles",
  "/theology",
  "/bible",
  "/privacy-terms",
  "/manifest.json",
  "/apple-icon.png",
  "/icon0.svg",
  "/icon1.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

type OfflineManifest = {
  routes?: string[];
  bibleBooks?: string[];
  contentAssets?: string[];
  generatedAt?: string;
};

function getCacheName(pathname: string) {
  if (pathname.startsWith("/_next/")) {
    return CACHE_NAMES.precache;
  }

  if (
    pathname === "/bible-notes.json" ||
    pathname.startsWith("/local-bible/") ||
    pathname.startsWith("/articles/") ||
    pathname.startsWith("/theology/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/images/")
  ) {
    return CACHE_NAMES.content;
  }

  return CACHE_NAMES.runtime;
}

async function cacheUrl(rawUrl: string) {
  if (!("caches" in window)) {
    return;
  }

  const targetUrl = new URL(rawUrl, window.location.origin);
  if (targetUrl.origin !== window.location.origin) {
    return;
  }

  const request = new Request(targetUrl.toString(), { cache: "no-cache" });
  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${targetUrl.pathname}`);
  }

  const cache = await caches.open(getCacheName(targetUrl.pathname));
  await cache.put(request, response.clone());
}

async function fetchManifest(): Promise<OfflineManifest> {
  const response = await fetch("/pwa-precache.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("Unable to load offline manifest.");
  }

  return (await response.json()) as OfflineManifest;
}

function getCurrentBuildAssetUrls() {
  const urls = new Set<string>();

  for (const element of document.querySelectorAll("script[src], link[href]")) {
    const source =
      element instanceof HTMLScriptElement ? element.src : element.getAttribute("href");

    if (!source) {
      continue;
    }

    const url = new URL(source, window.location.origin);
    if (url.origin !== window.location.origin) {
      continue;
    }

    if (url.pathname.startsWith("/_next/")) {
      urls.add(url.toString());
    }
  }

  for (const entry of performance.getEntriesByType("resource")) {
    if (!(entry instanceof PerformanceResourceTiming)) {
      continue;
    }

    try {
      const url = new URL(entry.name);
      if (url.origin !== window.location.origin) {
        continue;
      }

      if (url.pathname.startsWith("/_next/")) {
        urls.add(url.toString());
      }
    } catch {
      // Ignore malformed performance entries.
    }
  }

  return Array.from(urls);
}

function buildSyncUrlList(manifest: OfflineManifest) {
  return Array.from(
    new Set([
      ...CORE_SYNC_URLS,
      ...getCurrentBuildAssetUrls(),
      ...(manifest.routes || []),
      ...(manifest.bibleBooks || []),
      ...(manifest.contentAssets || []),
    ]),
  );
}

async function prefetchUrls(urls: string[], concurrency = 4) {
  if (!urls.length) {
    return { failures: 0 };
  }

  let cursor = 0;
  let failures = 0;

  const worker = async () => {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;

      try {
        await cacheUrl(urls[index]);
      } catch {
        failures += 1;
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()),
  );

  return { failures };
}

function isDocumentPath(pathname: string) {
  return !/\.[a-z0-9]+$/i.test(pathname);
}

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let syncPromise: Promise<void> | null = null;

    const syncOfflineContent = async () => {
      if (!navigator.onLine) {
        return;
      }

      if (syncPromise) {
        return syncPromise;
      }

      syncPromise = (async () => {
        try {
          await navigator.storage?.persist?.();
        } catch {
          // Ignore browsers that reject or do not support storage persistence.
        }

        const shellResult = await prefetchUrls(getCurrentBuildAssetUrls());
        const manifest = await fetchManifest();
        const currentVersion = manifest.generatedAt || "";
        const syncedVersion = window.localStorage.getItem(
          OFFLINE_MANIFEST_VERSION_KEY,
        );

        if (syncedVersion === currentVersion && shellResult.failures === 0) {
          window.localStorage.setItem(
            OFFLINE_LAST_SYNC_KEY,
            new Date().toISOString(),
          );
          return;
        }

        const urls = buildSyncUrlList(manifest);
        const result = await prefetchUrls(urls);

        if (result.failures === 0 && currentVersion) {
          window.localStorage.setItem(OFFLINE_MANIFEST_VERSION_KEY, currentVersion);
        } else if (result.failures > 0) {
          console.warn(
            `Offline sync skipped version update because ${result.failures} resources failed.`,
          );
        }

        window.localStorage.setItem(
          OFFLINE_LAST_SYNC_KEY,
          new Date().toISOString(),
        );
      })().catch((err) => {
        console.warn("Offline sync failed.", err);
      }).finally(() => {
        syncPromise = null;
      });

      return syncPromise;
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        await navigator.serviceWorker.ready;
        void syncOfflineContent();
      } catch (err) {
        console.warn("Service worker registration failed.", err);
      }
    };

    const handleOnline = () => {
      void syncOfflineContent();
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (navigator.onLine) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (
        !anchor ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      if (!isDocumentPath(url.pathname)) {
        return;
      }

      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }

      event.preventDefault();
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register);
    }

    window.addEventListener("online", handleOnline);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  return null;
}
