"use client";

import { useCallback, useEffect, useState } from "react";

type PrefetchManifest = {
  articles: string[];
  theologyTopics: string[];
  bibleBooks: string[];
  generatedAt?: string;
};

const CACHE_NAMES = {
  precache: "precache-v1",
  content: "content-v1",
  runtime: "runtime-v1",
} as const;

const OFFLINE_PREFETCH_FLAG = "kirubai-offline:prefetch";
const STATIC_ASSETS = [
  "/",
  "/articles",
  "/theology",
  "/theology/systematic-theology",
  "/theology/reformed-theology",
  "/bible",
  "/privacy-terms",
  "/manifest.json",
  "/apple-icon.png",
  "/icon0.svg",
  "/icon1.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/robots.txt",
  "/sitemap.xml",
];

type NextGlobals = {
  __NEXT_DATA__?: {
    buildId?: string;
  };
  __BUILD_MANIFEST__?: {
    buildId?: string;
  };
};

function getBuildId() {
  const globals = globalThis as NextGlobals;
  return (
    globals.__NEXT_DATA__?.buildId ?? globals.__BUILD_MANIFEST__?.buildId ?? ""
  );
}

function getCacheName(pathname: string) {
  if (pathname.startsWith("/_next/")) {
    return CACHE_NAMES.precache;
  }

  if (
    pathname === "/" ||
    pathname === "/articles" ||
    pathname === "/theology" ||
    pathname === "/theology/systematic-theology" ||
    pathname === "/theology/reformed-theology" ||
    pathname === "/bible" ||
    pathname === "/privacy-terms"
  ) {
    return CACHE_NAMES.runtime;
  }

  if (pathname.startsWith("/articles/")) {
    return CACHE_NAMES.content;
  }

  if (pathname.startsWith("/theology/")) {
    return CACHE_NAMES.content;
  }

  if (
    pathname === "/bible-notes.json" ||
    pathname.startsWith("/local-bible/")
  ) {
    return CACHE_NAMES.content;
  }

  return CACHE_NAMES.precache;
}

async function cacheUrl(url: string) {
  const origin = window.location.origin;
  const targetUrl = new URL(url, origin);
  const cacheName = getCacheName(targetUrl.pathname);

  const request = new Request(targetUrl.toString(), { cache: "no-cache" });
  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${targetUrl.pathname}`);
  }

  if (!("caches" in window)) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

function buildUrlList(manifest: PrefetchManifest, buildId: string) {
  const urls = new Set<string>(STATIC_ASSETS);

  urls.add("/local-bible/Books.json");
  for (const book of manifest.bibleBooks || []) {
    urls.add(book);
  }

  for (const article of manifest.articles || []) {
    urls.add(article);
  }

  for (const topic of manifest.theologyTopics || []) {
    urls.add(topic);

    const segments = topic.split("/").filter(Boolean);
    if (segments.length >= 3) {
      urls.add(`/${segments.slice(0, 3).join("/")}`);
    }
  }

  if (buildId) {
    urls.add(`/_next/data/${buildId}/index.json`);
    urls.add(`/_next/data/${buildId}/articles.json`);
    urls.add(`/_next/data/${buildId}/bible.json`);

    for (const article of manifest.articles || []) {
      const slug = article.replace(/^\/articles\//, "");
      if (slug) {
        urls.add(`/_next/data/${buildId}/articles/${slug}.json`);
      }
    }
  }

  return Array.from(urls);
}

async function fetchManifest(): Promise<PrefetchManifest> {
  const response = await fetch("/pwa-precache.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("Unable to load offline manifest.");
  }
  return (await response.json()) as PrefetchManifest;
}

type OfflineDownloaderProps = {
  className?: string;
};

export default function OfflineDownloader({ className }: OfflineDownloaderProps) {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [current, setCurrent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handleConnectionChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);
    handleConnectionChange();

    const stored = window.localStorage.getItem(OFFLINE_PREFETCH_FLAG);
    if (stored) {
      setLastSynced(stored);
    }
    setIsMounted(true);

    return () => {
      window.removeEventListener("online", handleConnectionChange);
      window.removeEventListener("offline", handleConnectionChange);
    };
  }, []);

  const startDownload = useCallback(async () => {
    if (!isOnline || status === "running") {
      return;
    }

    setError(null);
    setStatus("running");
    setProgress({ done: 0, total: 0 });

    try {
      const manifest = await fetchManifest();
      const buildId = getBuildId();
      const urls = buildUrlList(manifest, buildId);
      setProgress({ done: 0, total: urls.length });

      for (const url of urls) {
        setCurrent(url);
        await cacheUrl(url);
        setProgress((prev) => ({
          ...prev,
          done: prev.done + 1,
        }));
      }

      setStatus("done");
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(OFFLINE_PREFETCH_FLAG, timestamp);
      setLastSynced(timestamp);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Offline download failed.";
      setError(message);
      setStatus("idle");
    } finally {
      setCurrent("");
    }
  }, [isOnline, status]);

  return (
    <div
      className={className}
      aria-live="polite"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--background)",
        borderStyle: "solid",
        padding: 12,
        fontSize: "0.9rem",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        color: "var(--foreground)",
      }}
    >
      <div style={{ fontWeight: 600 }}>Offline content</div>
      {status === "idle" && (
        <>
          <div>
            Download all articles, theology topics, Bible books, and study
            notes for offline reading.
          </div>
          <button
            type="button"
            onClick={startDownload}
            disabled={!isOnline}
            style={{
              marginTop: 6,
              padding: "6px 10px",
              border: "1px solid currentColor",
              background: isOnline ? "var(--foreground)" : "transparent",
              color: isOnline ? "var(--background)" : "var(--muted-foreground)",
              cursor: isOnline ? "pointer" : "not-allowed",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {isOnline ? "Download now" : "Connect to Wi-Fi first"}
          </button>
        </>
      )}
      {status === "running" && (
        <>
          <div className="text-xs">
            Fetching {progress.done} of {progress.total} resources...
          </div>
          <progress
            value={progress.done}
            max={progress.total || undefined}
            style={{
              width: "100%",
              height: 6,
              borderRadius: 3,
              overflow: "hidden",
            }}
          />
          {current && (
            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
              Last: {current}
            </div>
          )}
        </>
      )}
      {status === "done" && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
          }}
        >
          <span>Offline cache is ready.</span>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            style={{
              fontSize: "0.75rem",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Refresh
          </button>
        </div>
      )}
      <div
        suppressHydrationWarning
        style={{
          color: "#c00",
          minHeight: 18,
          visibility: isMounted && error ? "visible" : "hidden",
        }}
        aria-live="polite"
      >
        {isMounted && error ? `Error: ${error}` : ""}
      </div>
      <div
        suppressHydrationWarning
        style={{
          fontSize: "0.7rem",
          color: "var(--muted-foreground)",
          minHeight: 18,
          visibility: isMounted && lastSynced ? "visible" : "hidden",
        }}
        aria-live="polite"
      >
        {isMounted && lastSynced
          ? `Last synced: ${new Date(lastSynced).toLocaleString()}`
          : ""}
      </div>
    </div>
  );
}
