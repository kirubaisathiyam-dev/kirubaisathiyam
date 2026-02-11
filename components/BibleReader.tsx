"use client";

import { parseBibleReference } from "@/lib/bible";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type BookIndexEntry = {
  book?: {
    english?: string;
    tamil?: string;
  };
};

type BookMeta = {
  english: string;
  tamil?: string;
};

type LocalBibleBook = {
  book?: {
    english?: string;
    tamil?: string;
  };
  count?: string;
  chapters?: Array<{
    chapter: string;
    verses: Array<{
      verse: string;
      text: string;
    }>;
  }>;
};

type BibleNote = {
  id?: string;
  position: string;
  title?: string;
  text?: string;
  image?: string;
};

type ParsedNote = BibleNote & {
  passageId: string;
  reference: string;
};

const defaultBook = "Genesis";

function getBookCode(bookName: string) {
  const parsed = parseBibleReference(`${bookName} 1:1`);
  if (!parsed) return null;
  return parsed.passageId.split(".")[0] || null;
}

function parseNotes(notes: BibleNote[]) {
  const map = new Map<string, ParsedNote[]>();
  for (const note of notes) {
    if (!note?.position) continue;
    const parsed = parseBibleReference(note.position);
    if (!parsed) continue;
    const entry: ParsedNote = {
      ...note,
      passageId: parsed.passageId,
      reference: parsed.reference,
    };
    const list = map.get(parsed.passageId) || [];
    list.push(entry);
    map.set(parsed.passageId, list);
  }
  return map;
}

function renderBibleText(text: string) {
  const paragraphs = text.split(/\n+/g).filter(Boolean);
  if (!paragraphs.length) return null;

  return paragraphs.map((paragraph, idx) => (
    <p key={`note-${idx}`} className="leading-relaxed">
      {renderBibleRefs(paragraph)}
    </p>
  ));
}

function renderBibleRefs(text: string) {
  const parts: ReactNode[] = [];
  const pattern = /\(([^()]+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(before);
    }

    const rawRef = match[1].trim();
    const parsed = parseBibleReference(rawRef);
    if (!parsed) {
      parts.push(match[0]);
    } else {
      parts.push(
        <button
          key={`${rawRef}-${match.index}`}
          type="button"
          className="bible-ref"
          style={{ margin: 0 }}
          data-passage={parsed.passageId}
          data-ref={rawRef}
        >
          {rawRef}
        </button>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  const after = text.slice(lastIndex);
  if (after) {
    parts.push(after);
  }

  return parts;
}

export default function BibleReader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>(defaultBook);
  const [selectedChapter, setSelectedChapter] = useState<string>("1");
  const [bookData, setBookData] = useState<LocalBibleBook | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [hasSyncedFromUrl, setHasSyncedFromUrl] = useState(false);
  const lastSearchKey = useRef<string | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const [activeImage, setActiveImage] = useState<{
    src: string;
    alt?: string;
  } | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let active = true;
    const loadIndex = async () => {
      try {
        const [booksResponse, notesResponse] = await Promise.all([
          fetch("/local-bible/Books.json"),
          fetch("/bible-notes.json"),
        ]);

        if (!booksResponse.ok) {
          throw new Error("Unable to load Books.json");
        }

        const booksData = (await booksResponse.json()) as BookIndexEntry[];
        const bookList = (booksData || [])
          .map((entry) => ({
            english: entry.book?.english?.trim() || "",
            tamil: entry.book?.tamil?.trim(),
          }))
          .filter((entry) => entry.english);

        if (active) {
          setBooks(bookList);
          const defaultSelection =
            bookList.find((entry) => entry.english === defaultBook)?.english ||
            bookList[0]?.english ||
            defaultBook;
          setSelectedBook(defaultSelection);
        }

        if (notesResponse.ok) {
          const notesData = (await notesResponse.json()) as BibleNote[];
          if (active) {
            setNotes(Array.isArray(notesData) ? notesData : []);
          }
        }
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Unable to load bible data.";
          setError(message);
        }
      }
    };

    loadIndex();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadBook = async () => {
      if (!selectedBook) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/local-bible/books/${encodeURIComponent(selectedBook)}.json`,
        );
        if (!response.ok) {
          throw new Error(`Unable to load ${selectedBook}`);
        }
        const data = (await response.json()) as LocalBibleBook;
        if (!active) return;
        setBookData(data);

        const chapters = data.chapters || [];
        const fallbackChapter = chapters[0]?.chapter || "1";
        setSelectedChapter((prev) =>
          chapters.some((chapter) => chapter.chapter === prev)
            ? prev
            : fallbackChapter,
        );
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Unable to load bible.";
          setError(message);
          setBookData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBook();
    return () => {
      active = false;
    };
  }, [selectedBook]);

  useEffect(() => {
    if (!activeImage) return;
    setZoomed(false);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImage(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [activeImage]);

  const searchKey = searchParams?.toString() || "";

  useEffect(() => {
    if (!books.length) return;
    if (hasSyncedFromUrl && lastSearchKey.current === searchKey) {
      return;
    }

    lastSearchKey.current = searchKey;

    const params = new URLSearchParams(searchKey);
    const bookParamRaw = params.get("book");
    const chapterParamRaw = params.get("chapter");

    let nextBook = selectedBook;
    if (bookParamRaw) {
      const bookParam = bookParamRaw.trim().toLowerCase();
      const matchedBook = books.find(
        (book) => book.english.toLowerCase() === bookParam,
      );
      if (matchedBook) {
        nextBook = matchedBook.english;
      }
    }

    let nextChapter = selectedChapter;
    if (chapterParamRaw) {
      const cleaned = chapterParamRaw.replace(/^0+(?=\d)/, "");
      if (cleaned) {
        nextChapter = cleaned;
      }
    }

    if (nextBook !== selectedBook) {
      setSelectedBook(nextBook);
    }
    if (nextChapter !== selectedChapter) {
      setSelectedChapter(nextChapter);
    }

    if (!hasSyncedFromUrl) {
      setHasSyncedFromUrl(true);
    }
  }, [
    books,
    hasSyncedFromUrl,
    searchKey,
    selectedBook,
    selectedChapter,
  ]);

  useEffect(() => {
    if (!hasSyncedFromUrl) return;
    if (!selectedBook || !selectedChapter) return;

    const params = new URLSearchParams(searchKey);
    const currentBook = params.get("book");
    const currentChapter = params.get("chapter");

    if (
      currentBook?.toLowerCase() === selectedBook.toLowerCase() &&
      currentChapter === selectedChapter
    ) {
      return;
    }

    params.set("book", selectedBook);
    params.set("chapter", selectedChapter);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    hasSyncedFromUrl,
    pathname,
    router,
    searchKey,
    selectedBook,
    selectedChapter,
  ]);

  const chapterOptions = useMemo(() => {
    return bookData?.chapters?.map((chapter) => chapter.chapter) || [];
  }, [bookData]);

  const selectedBookMeta = useMemo(() => {
    return books.find((entry) => entry.english === selectedBook);
  }, [books, selectedBook]);

  const notesByPassage = useMemo(() => parseNotes(notes), [notes]);

  const currentChapter = useMemo(() => {
    return (
      bookData?.chapters?.find(
        (chapter) => chapter.chapter === selectedChapter,
      ) || null
    );
  }, [bookData, selectedChapter]);

  const bookCode = useMemo(() => getBookCode(selectedBook), [selectedBook]);

  const chapterIndex = chapterOptions.indexOf(selectedChapter);
  const previousChapter =
    chapterIndex > 0 ? chapterOptions[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < chapterOptions.length - 1
      ? chapterOptions[chapterIndex + 1]
      : null;

  const title = selectedBookMeta?.tamil || selectedBook;
  const subtitle = selectedBookMeta?.tamil ? selectedBook : undefined;

  const scrollToTop = (behavior: ScrollBehavior = "smooth") => {
    if (!topRef.current) return;
    topRef.current.scrollIntoView({ behavior, block: "start" });
  };

  const handleBookChange = (book: string) => {
    setSelectedBook(book);
    window.requestAnimationFrame(() => scrollToTop("smooth"));
  };

  const handleChapterChange = (chapter: string) => {
    setSelectedChapter(chapter);
    window.requestAnimationFrame(() => scrollToTop("smooth"));
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div ref={topRef} />
      <section
        className="rounded border px-5 py-6 shadow-sm sm:px-6"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--muted-background)",
        }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--muted-foreground)" }}
            >
              Bible Reader
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                {title} {selectedChapter && ` ${selectedChapter}`}
              </h1>
              {subtitle && (
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
            <label className="text-sm font-semibold">
              Book
              <select
                value={selectedBook}
                onChange={(event) => handleBookChange(event.target.value)}
                className="mt-2 w-full rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--background)",
                }}
              >
                {books.map((book) => (
                  <option key={book.english} value={book.english}>
                    {book.tamil ? `${book.tamil} (${book.english})` : book.english}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Chapter
              <select
                value={selectedChapter}
                onChange={(event) => handleChapterChange(event.target.value)}
                className="mt-2 w-full rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--background)",
                }}
              >
                {chapterOptions.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {error && (
        <div
          className="rounded border px-4 py-3 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          className="rounded border px-4 py-3 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          Loading chapter...
        </div>
      )}

      {!loading && currentChapter && (
        <section className="space-y-6">
          <div className="space-y-5 text-[1.05rem] leading-8 sm:text-[1.2rem]">
            {currentChapter.verses.map((verse) => {
              const passageId = bookCode
                ? `${bookCode}.${selectedChapter}.${verse.verse}`
                : null;
              const verseNotes = passageId
                ? notesByPassage.get(passageId) || []
                : [];

              return (
                <div key={verse.verse} className="space-y-4">
                  {verseNotes.map((note, idx) => (
                    <article
                      key={`${note.id || note.position}-${idx}`}
                      className="rounded border px-4 py-4 shadow-sm"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--muted-background)",
                      }}
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide">
                        <span
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Study Note
                        </span>
                        <span
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {note.position}
                        </span>
                      </div>
                      {note.title && (
                        <h3 className="mb-2 text-lg font-semibold">
                          {note.title}
                        </h3>
                      )}
                      {note.text && (
                        <div className="space-y-3 text-base">
                          {renderBibleText(note.text)}
                        </div>
                      )}
                        {note.image && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveImage({
                                src: note.image || "",
                                alt: note.title || note.position,
                              })
                            }
                            className="mt-4 w-full overflow-hidden rounded border"
                            style={{ borderColor: "var(--border-color)" }}
                          >
                            <Image
                              src={note.image}
                              alt={note.title || note.position}
                              width={1200}
                              height={800}
                              sizes="(min-width: 1024px) 720px, 100vw"
                              className="h-auto w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                            />
                          </button>
                        )}
                    </article>
                  ))}
                  <div className="flex gap-3">
                    <span
                      className="w-8 shrink-0 text-right text-sm font-semibold"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {verse.verse}
                    </span>
                    <p className="flex-1">{verse.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!loading && currentChapter && (
        <section className="flex flex-col gap-3 border-t mt-12 pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-color)" }}>
          <button
            type="button"
            onClick={() =>
              previousChapter && handleChapterChange(previousChapter)
            }
            disabled={!previousChapter}
            className="rounded border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "var(--border-color)" }}
          >
            Previous Chapter
          </button>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Chapter {selectedChapter} of {chapterOptions.length || "--"}
          </p>
          <button
            type="button"
            onClick={() => nextChapter && handleChapterChange(nextChapter)}
            disabled={!nextChapter}
            className="rounded border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "var(--border-color)" }}
          >
            Next Chapter
          </button>
        </section>
      )}

      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative flex max-h-full max-w-full flex-col items-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="self-end rounded border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Close
            </button>
            <div className="max-h-[75vh] max-w-[90vw] overflow-auto">
              <Image
                src={activeImage.src}
                alt={activeImage.alt || "Bible note"}
                width={1600}
                height={1200}
                sizes="90vw"
                className={`w-auto cursor-zoom-in rounded transition-transform duration-300 ${
                  zoomed ? "scale-[1.5] cursor-zoom-out" : ""
                }`}
                onClick={() => setZoomed((prev) => !prev)}
              />
            </div>
            <p className="text-xs text-white/80">
              Click the image to {zoomed ? "zoom out" : "zoom in"}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
