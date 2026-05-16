"use client";

import { ArrowRightIcon } from "@/components/Icons";
import {
  BOOKS_CACHE_KEY,
  BOOK_CACHE_PREFIX,
  DEFAULT_BIBLE_BOOK,
  LAST_BIBLE_BOOK_STORAGE_KEY,
  getBookFileSlug,
  mapBookEntries,
  type BookIndexEntry,
  type BookMeta,
  type LocalBibleBook,
} from "@/lib/local-bible";
import { fetchWithOffline, getOfflineData } from "@/lib/offline";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function BibleFrontPage() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [expandedBook, setExpandedBook] = useState<string>(DEFAULT_BIBLE_BOOK);
  const [chapterMap, setChapterMap] = useState<Record<string, string[]>>({});
  const [loadingBook, setLoadingBook] = useState<string>("");
  const [error, setError] = useState("");
  const bookRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    let active = true;

    const getPreferredBook = (list: BookMeta[]) => {
      if (typeof window !== "undefined") {
        try {
          const saved = window.localStorage.getItem(LAST_BIBLE_BOOK_STORAGE_KEY);
          const matchedSavedBook = list.find((entry) => entry.english === saved);
          if (matchedSavedBook?.english) {
            return matchedSavedBook.english;
          }
        } catch {
          // Ignore storage failures and fall back to default selection.
        }
      }

      return (
        list.find((entry) => entry.english === DEFAULT_BIBLE_BOOK)?.english ||
        list[0]?.english ||
        DEFAULT_BIBLE_BOOK
      );
    };

    const loadBooks = async () => {
      try {
        const cachedBooks = await getOfflineData<BookMeta[]>(BOOKS_CACHE_KEY);
        if (active && cachedBooks?.length) {
          setBooks(cachedBooks);
          setExpandedBook(getPreferredBook(cachedBooks));
        }

        const bookList = await fetchWithOffline<BookMeta[]>(
          BOOKS_CACHE_KEY,
          async () => {
            const response = await fetch("/local-bible/Books.json", {
              cache: "no-cache",
            });
            if (!response.ok) {
              throw new Error("Unable to load Books.json");
            }
            const data = (await response.json()) as BookIndexEntry[];
            return mapBookEntries(data);
          },
        );

        if (active) {
          setBooks(bookList);
          setExpandedBook((current) => {
            if (current && bookList.some((entry) => entry.english === current)) {
              return current;
            }
            return getPreferredBook(bookList);
          });
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load bible books.",
          );
        }
      }
    };

    loadBooks();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadChapters = async () => {
      if (!expandedBook || chapterMap[expandedBook]) return;

      setLoadingBook(expandedBook);
      setError("");
      const slug = getBookFileSlug(expandedBook);
      const cacheKey = `${BOOK_CACHE_PREFIX}${slug}`;

      const applyBook = (book: LocalBibleBook | null) => {
        if (!book?.chapters?.length || !active) return;
        setChapterMap((current) => ({
          ...current,
          [expandedBook]: book.chapters?.map((chapter) => chapter.chapter) || [],
        }));
      };

      try {
        const cachedBook = await getOfflineData<LocalBibleBook>(cacheKey);
        applyBook(cachedBook);

        const data = await fetchWithOffline<LocalBibleBook>(cacheKey, async () => {
          const response = await fetch(
            `/local-bible/books/${encodeURIComponent(slug)}.json`,
            { cache: "no-cache" },
          );
          if (!response.ok) {
            throw new Error(`Unable to load ${expandedBook}`);
          }
          return (await response.json()) as LocalBibleBook;
        });

        applyBook(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load chapters.",
          );
        }
      } finally {
        if (active) {
          setLoadingBook("");
        }
      }
    };

    loadChapters();
    return () => {
      active = false;
    };
  }, [chapterMap, expandedBook]);

  useEffect(() => {
    if (!expandedBook || !books.length) return;

    let frameId = 0;
    let timeoutId: ReturnType<typeof window.setTimeout> | null = null;
    let startTime = 0;

    const alignExpandedBook = () => {
      const target = bookRefs.current[expandedBook];
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({
          top: Math.max(top, 0),
          behavior: "smooth",
        });
      }
    };

    const runAlignment = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      alignExpandedBook();

      if (timestamp - startTime < 380) {
        frameId = window.requestAnimationFrame(runAlignment);
      }
    };

    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(runAlignment);
    }, 20);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [books.length, expandedBook]);

  const visibleBooks = useMemo(() => books, [books]);
  const oldTestamentBooks = useMemo(
    () => visibleBooks.slice(0, 39),
    [visibleBooks],
  );
  const newTestamentBooks = useMemo(
    () => visibleBooks.slice(39),
    [visibleBooks],
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl text-center mb-8">
          பரிசுத்த வேதாகமம்
        </h1>
      </header>

      {error && (
        <div
          className="rounded border px-4 py-3 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          {error}
        </div>
      )}

      <div className="space-y-8">
        {[
          { title: "பழைய ஏற்பாடு", books: oldTestamentBooks },
          { title: "புதிய ஏற்பாடு", books: newTestamentBooks },
        ].map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="text-lg font-semibold">{group.title}</h2>

            <div className="space-y-3">
              {group.books.map((book) => {
                const isOpen = expandedBook === book.english;
                const chapters = chapterMap[book.english] || [];

                return (
                  <section
                    key={book.english}
                    ref={(node) => {
                      bookRefs.current[book.english] = node;
                    }}
                    className="scroll-mt-3 overflow-hidden border"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--muted-background)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedBook(book.english)}
                      className="flex w-full items-center justify-between gap-4 p-3 text-left transition hover:opacity-80"
                      aria-expanded={isOpen}
                    >
                      <span className="font-medium">
                        {book.tamil || book.english}
                      </span>
                      <span
                        className={`inline-flex transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                        aria-hidden="true"
                      >
                        <ArrowRightIcon style={{ width: 18, height: 18 }} />
                      </span>
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div
                          className="border-t px-5 pb-5 pt-4"
                          style={{ borderColor: "var(--border-color)" }}
                        >
                          {loadingBook === book.english && !chapters.length ? (
                            <div
                              className="text-sm"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Loading chapters...
                            </div>
                          ) : (
                            <div
                              className="grid overflow-hidden border border-b-0 border-r-0"
                              style={{
                                borderColor: "var(--border-color)",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(min(100%, 5rem), 1fr))",
                              }}
                            >
                              {chapters.map((chapter) => (
                                <Link
                                  key={chapter}
                                  href={`/bible/read?book=${encodeURIComponent(
                                    book.english,
                                  )}&chapter=${encodeURIComponent(chapter)}`}
                                  onClick={() => setExpandedBook(book.english)}
                                  className="inline-flex h-14 items-center justify-center border-b border-r px-3 py-3 text-sm font-semibold transition hover:opacity-80"
                                  style={{
                                    borderColor: "var(--border-color)",
                                    background: "var(--background)",
                                    color: "var(--foreground)",
                                  }}
                                >
                                  {chapter.toLowerCase() === "intro" ||
                                  chapter === "அறிமுகம்"
                                    ? "அறி"
                                    : chapter}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
