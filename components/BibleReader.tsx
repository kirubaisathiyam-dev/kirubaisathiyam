"use client";

import { parseBibleReference, replaceBibleRefsInHtml } from "@/lib/bible";
import BibleSelectionBar from "@/components/BibleSelectionBar";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

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
    type?: string;
    content?: string;
    verses?: Array<{
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

type BibleReaderProps = {
  siteUrl?: string;
};

const defaultBook = "Genesis";
const COPY_RESET_MS = 1800;

function getNoteKey(note: BibleNote) {
  if (note.id) return note.id;
  const title = note.title || "";
  const text = note.text || "";
  return `${note.position}::${title}::${text}`;
}

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

function parseVerseNumbers(value: string | null) {
  if (!value) return [];
  const cleaned = value.replace(/\s+/g, "");
  if (!cleaned) return [];

  const entries = cleaned.split(",");
  const numbers: number[] = [];

  for (const entry of entries) {
    if (!entry) continue;
    if (entry.includes("-")) {
      const [startRaw, endRaw] = entry.split("-");
      const start = Number.parseInt(startRaw, 10);
      const end = Number.parseInt(endRaw, 10);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      for (let idx = low; idx <= high; idx += 1) {
        numbers.push(idx);
      }
    } else {
      const num = Number.parseInt(entry, 10);
      if (Number.isFinite(num)) {
        numbers.push(num);
      }
    }
  }

  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

function formatVerseNumbers(values: number[]) {
  if (!values.length) return "";
  const sorted = Array.from(new Set(values)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let rangeStart = sorted[0];
  let previous = sorted[0];

  for (let idx = 1; idx < sorted.length; idx += 1) {
    const current = sorted[idx];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    ranges.push(
      rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`,
    );
    rangeStart = current;
    previous = current;
  }

  ranges.push(
    rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`,
  );
  return ranges.join(",");
}

async function copyToClipboard(text: string) {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function BibleReader({ siteUrl }: BibleReaderProps) {
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
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [lastClickedVerse, setLastClickedVerse] = useState<number | null>(null);
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [scrollToSelection, setScrollToSelection] = useState(false);
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
        const fallbackChapter =
          chapters.find((chapter) => chapter.chapter === "1")?.chapter ||
          chapters[0]?.chapter ||
          "1";
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
    const versesParamRaw = params.get("verses");

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

    const parsedVerses = parseVerseNumbers(versesParamRaw);
    const nextVerses = formatVerseNumbers(parsedVerses);
    const currentVerses = formatVerseNumbers(selectedVerses);

    if (nextBook !== selectedBook) {
      setSelectedBook(nextBook);
    }
    if (nextChapter !== selectedChapter) {
      setSelectedChapter(nextChapter);
    }
    if (nextVerses !== currentVerses) {
      setSelectedVerses(parsedVerses);
      setLastClickedVerse(
        parsedVerses.length ? parsedVerses[parsedVerses.length - 1] : null,
      );
      if (parsedVerses.length) {
        setScrollToSelection(true);
      }
    }

    if (!hasSyncedFromUrl) {
      setHasSyncedFromUrl(true);
    }
  }, [books, hasSyncedFromUrl, searchKey, selectedBook, selectedChapter]);

  useEffect(() => {
    if (!hasSyncedFromUrl) return;
    if (!selectedBook || !selectedChapter) return;

    const params = new URLSearchParams(searchKey);
    const currentBook = params.get("book");
    const currentChapter = params.get("chapter");
    const currentVerses = params.get("verses") || "";
    const nextVerses = formatVerseNumbers(selectedVerses);

    if (
      currentBook?.toLowerCase() === selectedBook.toLowerCase() &&
      currentChapter === selectedChapter &&
      currentVerses === nextVerses
    ) {
      return;
    }

    params.set("book", selectedBook);
    params.set("chapter", selectedChapter);
    if (nextVerses) {
      params.set("verses", nextVerses);
    } else {
      params.delete("verses");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    hasSyncedFromUrl,
    pathname,
    router,
    searchKey,
    selectedBook,
    selectedChapter,
    selectedVerses,
  ]);

  const chapterOptions = useMemo(() => {
    return bookData?.chapters?.map((chapter) => chapter.chapter) || [];
  }, [bookData]);

  const selectedBookMeta = useMemo(() => {
    return books.find((entry) => entry.english === selectedBook);
  }, [books, selectedBook]);

  const markdownProcessor = useMemo(
    () => remark().use(remarkGfm).use(remarkRehype).use(rehypeStringify),
    [],
  );

  const notesHtml = useMemo(() => {
    if (!notes.length) {
      return new Map<string, string>();
    }

    const htmlMap = new Map<string, string>();

    notes.forEach((note) => {
      const text = typeof note.text === "string" ? note.text : "";
      if (!text.trim()) return;
      const key = getNoteKey(note);
      const processed = markdownProcessor.processSync(text);
      const html = replaceBibleRefsInHtml(processed.toString());
      htmlMap.set(key, html);
    });

    return htmlMap;
  }, [markdownProcessor, notes]);

  const notesByPassage = useMemo(() => parseNotes(notes), [notes]);

  const currentChapter = useMemo(() => {
    return (
      bookData?.chapters?.find(
        (chapter) => chapter.chapter === selectedChapter,
      ) || null
    );
  }, [bookData, selectedChapter]);

  const chapterHtml = useMemo(() => {
    const content =
      typeof currentChapter?.content === "string" ? currentChapter.content : "";
    if (!content.trim()) return "";
    const processed = markdownProcessor.processSync(content);
    return replaceBibleRefsInHtml(processed.toString());
  }, [currentChapter?.content, markdownProcessor]);

  const chapterVerses = currentChapter?.verses || [];

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
    setSelectedVerses([]);
    setLastClickedVerse(null);
    window.requestAnimationFrame(() => scrollToTop("smooth"));
  };

  const handleChapterChange = (chapter: string) => {
    setSelectedChapter(chapter);
    setSelectedVerses([]);
    setLastClickedVerse(null);
    window.requestAnimationFrame(() => scrollToTop("smooth"));
  };

  const verseSet = useMemo(() => new Set(selectedVerses), [selectedVerses]);
  const verseLabel = useMemo(
    () => formatVerseNumbers(selectedVerses),
    [selectedVerses],
  );
  const bookLabel = selectedBookMeta?.tamil || selectedBook;

  const selectedVerseTexts = useMemo(() => {
    const verses = currentChapter?.verses || [];
    if (!verses.length || !selectedVerses.length) return [];
    return verses
      .filter((verse) => verseSet.has(Number.parseInt(verse.verse, 10)))
      .map((verse) => verse.text.trim())
      .filter(Boolean);
  }, [currentChapter, selectedVerses, verseSet]);

  const shareUrl = useMemo(() => {
    if (!selectedBook || !selectedChapter) return "";
    const baseUrl =
      siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const normalizedBase = baseUrl ? baseUrl.replace(/\/+$/, "") : "";
    const params = new URLSearchParams();
    params.set("book", selectedBook);
    params.set("chapter", selectedChapter);
    if (verseLabel) {
      params.set("verses", verseLabel);
    }
    const path = `/bible?${params.toString()}`;
    return normalizedBase ? `${normalizedBase}${path}` : path;
  }, [selectedBook, selectedChapter, verseLabel]);

  const shareReference = useMemo(() => {
    if (!selectedVerses.length) return "";
    return `${bookLabel} ${selectedChapter}:${verseLabel}`;
  }, [bookLabel, selectedChapter, selectedVerses.length, verseLabel]);

  const shareText = useMemo(() => {
    if (!selectedVerseTexts.length) return "";
    return `${selectedVerseTexts.join(" ")}\n\n${shareReference}\n${shareUrl}`;
  }, [selectedVerseTexts, shareReference, shareUrl]);

  const handleVerseClick = (event: React.MouseEvent, verseNumber: number) => {
    setCopyMessage("");
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      if (event.shiftKey && lastClickedVerse !== null) {
        const start = Math.min(lastClickedVerse, verseNumber);
        const end = Math.max(lastClickedVerse, verseNumber);
        for (let idx = start; idx <= end; idx += 1) {
          next.add(idx);
        }
      } else if (next.has(verseNumber)) {
        next.delete(verseNumber);
      } else {
        next.add(verseNumber);
      }
      return Array.from(next).sort((a, b) => a - b);
    });
    setLastClickedVerse(verseNumber);
  };

  const handleCopy = async () => {
    if (!shareText) return;
    const ok = await copyToClipboard(shareText);
    setCopyMessage(ok ? "Copied!" : "Unable to copy.");
    if (ok) {
      window.setTimeout(() => setCopyMessage(""), COPY_RESET_MS);
    }
  };

  const handleShare = async () => {
    if (!shareText) return;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: shareReference,
          text: `${selectedVerseTexts.join(" ")}\n\n${shareReference}`,
          url: shareUrl,
        });
        return;
      } catch {
        // fall back to copy
      }
    }
    await handleCopy();
  };

  useEffect(() => {
    if (!scrollToSelection || !selectedVerses.length) return;
    const firstVerse = selectedVerses[0];
    const target = document.getElementById(`verse-${firstVerse}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setScrollToSelection(false);
  }, [scrollToSelection, selectedVerses]);

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
              புத்தகம்
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
                    {book.tamil
                      ? `${book.tamil} (${book.english})`
                      : book.english}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              அதிகாரம்
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
          {chapterHtml && (
            <div
              className="prose prose-neutral max-w-none"
              dangerouslySetInnerHTML={{ __html: chapterHtml }}
            />
          )}
          {chapterVerses.length > 0 && (
            <div className="space-y-5 text-[1.05rem] leading-8 sm:text-[1.2rem]">
              {chapterVerses.map((verse) => {
                const passageId = bookCode
                  ? `${bookCode}.${selectedChapter}.${verse.verse}`
                  : null;
                const verseNotes = passageId
                  ? notesByPassage.get(passageId) || []
                  : [];
                const verseNumber = Number.parseInt(verse.verse, 10);
                const isSelected = verseSet.has(verseNumber);

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
                          <span style={{ color: "var(--muted-foreground)" }}>
                            Study Note
                          </span>
                          <span style={{ color: "var(--muted-foreground)" }}>
                            {note.position}
                          </span>
                        </div>
                        {note.title && (
                          <h3 className="mb-2 text-lg font-semibold">
                            {note.title}
                          </h3>
                        )}
                        {note.text && (
                          (() => {
                            const noteKey = getNoteKey(note);
                            const noteHtml = notesHtml.get(noteKey);
                            if (noteHtml) {
                              return (
                                <div
                                  className="prose prose-neutral max-w-none"
                                  dangerouslySetInnerHTML={{ __html: noteHtml }}
                                />
                              );
                            }

                            return (
                              <div className="space-y-3 text-base">
                                {renderBibleText(note.text)}
                              </div>
                            );
                          })()
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
                            className="mt-4 w-full cursor-pointer overflow-hidden rounded border"
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
                    <button
                      id={`verse-${verse.verse}`}
                      type="button"
                      onClick={(event) => handleVerseClick(event, verseNumber)}
                      className={`bible-verse ${isSelected ? "is-selected" : ""}`}
                      data-verse={verse.verse}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="verse-number"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {verse.verse}
                      </span>
                      <span className="verse-text">
                        <span className="verse-text-inner">{verse.text}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {selectedVerses.length > 0 && (
            <div className="sticky bottom-6 z-40 flex flex-col items-center gap-3">
              <div className="flex flex-col gap-3">
                <BibleSelectionBar
                  reference={shareReference}
                  message={copyMessage}
                  onCopy={handleCopy}
                  onShare={handleShare}
                  onClear={() => {
                    setSelectedVerses([]);
                    setLastClickedVerse(null);
                    setCopyMessage("");
                  }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {!loading && currentChapter && (
        <section
          className="flex gap-3 border-t mt-12 pt-6 flex-row items-center justify-between"
          style={{ borderColor: "var(--border-color)" }}
        >
          <button
            type="button"
            onClick={() =>
              previousChapter && handleChapterChange(previousChapter)
            }
            disabled={!previousChapter}
            className="cursor-pointer rounded border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Previous chapter"
          >
            <span className="md:hidden" aria-hidden="true">
              <i className="fa-solid fa-arrow-left"></i>
            </span>
            <span className="hidden md:inline">முந்தின அதிகாரம்</span>
          </button>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            அதிகாரம் {selectedChapter} of {chapterOptions.length || "--"}
          </p>
          <button
            type="button"
            onClick={() => nextChapter && handleChapterChange(nextChapter)}
            disabled={!nextChapter}
            className="cursor-pointer rounded border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Next chapter"
          >
            <span className="md:hidden" aria-hidden="true">
              <i className="fa-solid fa-arrow-right"></i>
            </span>
            <span className="hidden md:inline">அடுத்த அதிகாரம்</span>
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
              className="cursor-pointer self-end rounded border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
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
