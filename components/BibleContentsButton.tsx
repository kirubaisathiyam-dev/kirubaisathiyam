"use client";

import { ArrowRightIcon, CloseIcon, ListIcon } from "@/components/Icons";
import LoadingIndicator from "@/components/LoadingIndicator";
import {
  BOOKS_CACHE_KEY,
  BOOK_CACHE_PREFIX,
  getBookFileSlug,
  mapBookEntries,
  type BookIndexEntry,
  type BookMeta,
  type LocalBibleBook,
} from "@/lib/local-bible";
import { fetchWithOffline, getOfflineData } from "@/lib/offline";
import { useEffect, useMemo, useRef, useState } from "react";

type BibleContentsButtonProps = {
  currentBook: string;
  currentChapter: string;
  onSelect: (book: string, chapter: string) => void;
  className?: string;
};

export default function BibleContentsButton({
  currentBook,
  currentChapter,
  onSelect,
  className,
}: BibleContentsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [chapterMap, setChapterMap] = useState<Record<string, string[]>>({});
  const [expandedBook, setExpandedBook] = useState(currentBook);
  const [loadingBook, setLoadingBook] = useState("");
  const [error, setError] = useState("");
  const bookRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setExpandedBook(currentBook);
  }, [currentBook, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const loadBooks = async () => {
      try {
        const cachedBooks = await getOfflineData<BookMeta[]>(BOOKS_CACHE_KEY);
        if (active && cachedBooks?.length) {
          setBooks(cachedBooks);
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !expandedBook || chapterMap[expandedBook]) return;

    let active = true;

    const loadChapters = async () => {
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
  }, [chapterMap, expandedBook, isOpen]);

  useEffect(() => {
    if (!isOpen || !expandedBook || !books.length) return;

    let frameId = 0;
    let timeoutId: number | null = null;
    let startTime = 0;

    const alignExpandedBook = () => {
      const container = scrollContainerRef.current;
      const target = bookRefs.current[expandedBook];
      if (container && target) {
        const chapterTarget =
          expandedBook === currentBook
            ? target.querySelector<HTMLElement>(
                `[data-chapter-id="${currentChapter}"]`,
              )
            : null;

        const targetRect = target.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetTop =
          container.scrollTop + (targetRect.top - containerRect.top) - 12;

        if (chapterTarget) {
          const chapterRect = chapterTarget.getBoundingClientRect();
          const chapterTop =
            container.scrollTop + (chapterRect.top - containerRect.top) - 96;
          container.scrollTo({
            top: Math.max(chapterTop, targetTop, 0),
            behavior: "smooth",
          });
        } else {
          container.scrollTo({
            top: Math.max(targetTop, 0),
            behavior: "smooth",
          });
        }
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
  }, [books.length, currentBook, currentChapter, expandedBook, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const oldTestamentBooks = useMemo(() => books.slice(0, 39), [books]);
  const newTestamentBooks = useMemo(() => books.slice(39), [books]);

  const handleChapterSelect = (book: string, chapter: string) => {
    setIsOpen(false);
    onSelect(book, chapter);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`cursor-pointer rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80 ${
          className ?? ""
        }`}
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
        aria-label="Open bible contents"
      >
        <ListIcon style={{ width: 20, height: 20 }} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bible-contents-title"
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col border shadow-xl"
            style={{
              borderColor: "var(--theme-border-color)",
              background: "var(--theme-background)",
              color: "var(--theme-foreground)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: "var(--theme-border-color)" }}>
              <div className="space-y-1">
                <h2 id="bible-contents-title" className="text-xl font-semibold">
                  பரிசுத்த வேதாகமம்
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:opacity-80"
                style={{
                  borderColor: "var(--theme-border-color)",
                  color: "var(--theme-foreground)",
                }}
                aria-label="Close contents"
              >
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div ref={scrollContainerRef} className="overflow-y-auto p-5">
              {error && (
                <div
                  className="mb-4 rounded border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--theme-border-color)" }}
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
                    <h3 className="text-lg font-semibold">{group.title}</h3>

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
                              borderColor: "var(--theme-border-color)",
                              background: "var(--theme-muted-background)",
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
                                  style={{ borderColor: "var(--theme-border-color)" }}
                                >
                                  {loadingBook === book.english && !chapters.length ? (
                                    <LoadingIndicator className="py-4" size={24} />
                                  ) : (
                                    <div
                                      className="grid overflow-hidden border border-b-0 border-r-0"
                                      style={{
                                        borderColor: "var(--theme-border-color)",
                                        gridTemplateColumns:
                                          "repeat(auto-fit, minmax(min(100%, 5rem), 1fr))",
                                      }}
                                    >
                                      {chapters.map((chapter) => {
                                        const isCurrent =
                                          book.english === currentBook &&
                                          chapter === currentChapter;

                                        return (
                                          <button
                                            key={chapter}
                                            type="button"
                                            onClick={() =>
                                              handleChapterSelect(book.english, chapter)
                                            }
                                            data-chapter-id={chapter}
                                            className="inline-flex h-14 items-center justify-center border-b border-r px-3 py-3 text-sm font-semibold transition hover:opacity-80"
                                            style={{
                                              borderColor: "var(--theme-border-color)",
                                              background: isCurrent
                                                ? "var(--theme-foreground)"
                                                : "var(--theme-background)",
                                              color: isCurrent
                                                ? "var(--theme-background)"
                                                : "var(--theme-foreground)",
                                            }}
                                          >
                                            {chapter.toLowerCase() === "intro"
                                              ? "அறி"
                                              : chapter}
                                          </button>
                                        );
                                      })}
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
          </div>
        </div>
      )}
    </>
  );
}
