"use client";

import BibleSearchForm from "@/components/BibleSearchForm";
import { SearchIcon } from "@/components/Icons";
import LoadingIndicator from "@/components/LoadingIndicator";
import { BibleSearchPageSkeleton } from "@/components/PageSkeletons";
import {
  createBibleSearchIndex,
  loadBibleSearchCorpus,
  searchBibleIndex,
  type BibleSearchVerse,
} from "@/lib/bible-search";
import type {
  BibleSearchWorkerMessage,
  BibleSearchWorkerResponse,
} from "@/lib/bible-search-worker";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const PAGE_SIZE = 10;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMatchTerms(query: string) {
  return Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 0),
    ),
  );
}

function highlightContent(text: string, query: string) {
  const terms = getMatchTerms(query);
  if (!terms.length) {
    return [text];
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "giu");
  return text.split(pattern);
}

function isHighlightedPart(part: string, query: string) {
  return getMatchTerms(query).some(
    (term) =>
      part.localeCompare(term, "ta", {
        sensitivity: "base",
      }) === 0,
  );
}

export default function BibleSearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchPath = pathname || "/bible/search";
  const searchParams = useSearchParams();
  const query = searchParams?.get("q")?.trim() || "";
  const rawPage = Number.parseInt(searchParams?.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const deferredQuery = useDeferredValue(query);
  const [corpus, setCorpus] = useState<BibleSearchVerse[]>([]);
  const [results, setResults] = useState<BibleSearchVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastResolvedQuery, setLastResolvedQuery] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const indexRef = useRef<ReturnType<typeof createBibleSearchIndex> | null>(null);
  const corpusRef = useRef<BibleSearchVerse[]>([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let active = true;
    let worker: Worker | null = null;

    const enableMainThreadSearch = (nextCorpus: BibleSearchVerse[]) => {
      if (indexRef.current) {
        return;
      }

      indexRef.current = createBibleSearchIndex(nextCorpus);
      setIsLoading(false);
    };

    try {
      worker = new Worker(new URL("../lib/bible-search.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;
    } catch {
      workerRef.current = null;
    }

    const handleWorkerMessage = (
      event: MessageEvent<BibleSearchWorkerResponse>,
    ) => {
      if (!active) return;

      const message = event.data;

      if (message.type === "ready") {
        setIsLoading(false);
        return;
      }

      if (message.type === "result") {
        if (message.requestId !== requestIdRef.current) {
          return;
        }

        startTransition(() => {
          setResults(message.results);
          setLastResolvedQuery(message.query);
        });
        return;
      }

      setError(message.message);
      setIsLoading(false);
    };

    const handleWorkerFailure = () => {
      if (!active) return;

      workerRef.current = null;
      worker?.terminate();

      if (corpusRef.current.length) {
        enableMainThreadSearch(corpusRef.current);
      }
    };

    worker?.addEventListener("message", handleWorkerMessage);
    worker?.addEventListener("error", handleWorkerFailure);

    const loadSearch = async () => {
      try {
        const nextCorpus = await loadBibleSearchCorpus();
        if (!active) return;

        corpusRef.current = nextCorpus;
        startTransition(() => {
          setCorpus(nextCorpus);
        });

        if (workerRef.current) {
          workerRef.current.postMessage({
            type: "init",
            corpus: nextCorpus,
          } satisfies BibleSearchWorkerMessage);
          return;
        }

        enableMainThreadSearch(nextCorpus);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Bible search.",
        );
        setIsLoading(false);
      }
    };

    void loadSearch();

    return () => {
      active = false;
      worker?.removeEventListener("message", handleWorkerMessage);
      worker?.removeEventListener("error", handleWorkerFailure);
      worker?.terminate();
      workerRef.current = null;
      indexRef.current = null;
      corpusRef.current = [];
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (isLoading) {
      return;
    }

    if (!worker) {
      const index = indexRef.current;
      if (!index) {
        return;
      }

      startTransition(() => {
        setResults(searchBibleIndex(index, deferredQuery));
        setLastResolvedQuery(deferredQuery);
      });
      return;
    }

    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    worker.postMessage({
      type: "search",
      query: deferredQuery,
      requestId: nextRequestId,
    } satisfies BibleSearchWorkerMessage);
  }, [deferredQuery, isLoading]);

  const isSearching = !isLoading && deferredQuery !== lastResolvedQuery;

  const resultLabel = useMemo(() => {
    if (!query) return "";
    return `${results.length} முடிவுகள்`;
  }, [query, results.length]);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const paginatedResults =
    totalPages === 0
      ? []
      : results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updatePage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (nextPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }

      const search = params.toString();
      startTransition(() => {
        router.push(search ? `${searchPath}?${search}` : searchPath);
      });
    },
    [router, searchParams, searchPath],
  );

  useEffect(() => {
    if (!query || totalPages <= 1 || page === currentPage) return;
    updatePage(currentPage);
  }, [currentPage, page, query, totalPages, updatePage]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-5">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">வேதாகம தேடல்</h1>
        </div>
        <div className="mx-auto max-w-3xl">
          <BibleSearchForm
            initialQuery={query}
            autoFocus
            className="min-h-[4rem] px-4 py-3"
          />
        </div>
      </header>

      {isLoading ? (
        <BibleSearchPageSkeleton />
      ) : error ? (
        <section
          className="mx-auto max-w-3xl border px-6 py-10 text-center"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--muted-background)",
          }}
        >
          <p className="text-lg font-semibold">{error}</p>
        </section>
      ) : !query ? (
        <section
          className="mx-auto max-w-3xl border px-6 py-14 text-center"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--muted-background)",
          }}
        >
          <SearchIcon
            className="mx-auto"
            style={{
              width: 34,
              height: 34,
              color: "var(--muted-foreground)",
              transform: "scaleX(-1)",
            }}
          />
          <h2 className="mt-4 text-2xl font-semibold">
            வேதாகமத்தில் தேடுங்கள்
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            சொல், சொற்றொடர், புத்தகப் பெயர், அல்லது வசன குறிப்பால் தேடலாம்.
          </p>
          <p
            className="mt-4 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            {corpus.length.toLocaleString("en-US")} வசனங்கள் offline search-க்கு
            தயாராக உள்ளன.
          </p>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p style={{ color: "var(--muted-foreground)" }}>{resultLabel}</p>
              {isSearching ? (
                <LoadingIndicator size={18} />
              ) : totalPages > 1 ? (
                <p style={{ color: "var(--muted-foreground)" }}>
                  Page {currentPage} of {totalPages}
                </p>
              ) : null}
            </div>
            <h2 className="text-xl font-semibold">&quot;{query}&quot;</h2>
          </div>

          {results.length === 0 ? (
            <div
              className="border px-6 py-10 text-center"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--muted-background)",
              }}
            >
              <p className="text-lg font-semibold">முடிவுகள் இல்லை</p>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                வேறு சொல் அல்லது சிறிய பகுதியை முயற்சி செய்யுங்கள்.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedResults.map((result) => (
                <Link
                  key={result.id}
                  href={`/bible/read?book=${encodeURIComponent(
                    result.bookEnglish,
                  )}&chapter=${encodeURIComponent(
                    result.chapter,
                  )}&verses=${encodeURIComponent(result.verse)}`}
                  className="block border px-5 py-5 transition hover:opacity-85"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--background)",
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {result.reference}
                  </p>
                  <p
                    className="mt-3 text-lg leading-8"
                    style={{ color: "var(--foreground)" }}
                  >
                    {highlightContent(result.text, query).map((part, index) =>
                      isHighlightedPart(part, query) ? (
                        <mark
                          key={`${result.id}-${index}`}
                          className="px-1"
                          style={{
                            background: "var(--muted-background)",
                            color: "var(--foreground)",
                          }}
                        >
                          {part}
                        </mark>
                      ) : (
                        <span key={`${result.id}-${index}`}>{part}</span>
                      ),
                    )}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updatePage(Math.max(1, Math.min(totalPages, currentPage - 1)))
                }
                disabled={currentPage === 1}
                className="cursor-pointer border px-3 py-1 text-sm disabled:cursor-not-allowed"
                style={{
                  borderColor: "var(--border-color)",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => {
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => updatePage(pageNumber)}
                      className="cursor-pointer border px-3 py-1 text-sm"
                      style={{
                        borderColor: isActive
                          ? "var(--foreground)"
                          : "var(--border-color)",
                        background: isActive
                          ? "var(--foreground)"
                          : "transparent",
                        color: isActive ? "var(--background)" : "inherit",
                      }}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {pageNumber}
                    </button>
                  );
                },
              )}
              <button
                type="button"
                onClick={() =>
                  updatePage(Math.max(1, Math.min(totalPages, currentPage + 1)))
                }
                disabled={currentPage === totalPages}
                className="cursor-pointer border px-3 py-1 text-sm disabled:cursor-not-allowed"
                style={{
                  borderColor: "var(--border-color)",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
