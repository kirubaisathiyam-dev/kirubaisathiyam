"use client";

import { getOfflineData, setOfflineData } from "@/lib/offline";
import { getBookByCode, parseBibleReference } from "@/lib/bible";
import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/Icons";
import LoadingIndicator from "@/components/LoadingIndicator";

type TooltipState = {
  visible: boolean;
  loading: boolean;
  locked: boolean;
  reference: string;
  content: string;
  x: number;
  y: number;
};

const initialState: TooltipState = {
  visible: false,
  loading: false,
  locked: false,
  reference: "",
  content: "",
  x: 0,
  y: 0,
};

type VerseCacheEntry = {
  reference: string;
  content: string;
};

type LocalBibleBook = {
  book?: {
    english?: string;
    tamil?: string;
  };
  chapters?: Array<{
    chapter: string;
    verses: Array<{
      verse: string;
      text: string;
    }>;
  }>;
};

const VERSE_CACHE_PREFIX = "verse:";
const verseCache = new Map<string, VerseCacheEntry>();
const localBibleBasePath = "/local-bible";
let localBooksIndexPromise:
  | Promise<Map<string, { english?: string; tamil?: string }>>
  | null = null;
const localBookCache = new Map<string, Promise<LocalBibleBook>>();

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function positionTooltip(
  rect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
) {
  const margin = 12;
  const gap = 8;
  const maxX = window.innerWidth - tooltipWidth - margin;
  const x = clamp(rect.left, margin, maxX);
  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  let y = rect.bottom + gap;

  if (spaceBelow < tooltipHeight + gap && spaceAbove >= tooltipHeight + gap) {
    y = rect.top - tooltipHeight - gap;
  } else if (spaceBelow < tooltipHeight + gap && spaceAbove < tooltipHeight) {
    y =
      spaceBelow >= spaceAbove
        ? window.innerHeight - tooltipHeight - margin
        : margin;
  }

  y = clamp(y, margin, window.innerHeight - tooltipHeight - margin);
  return { x, y };
}

export default function BibleReferenceTooltip() {
  const [state, setState] = useState<TooltipState>(initialState);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const enhanceRoots = () => {
      const roots = Array.from(document.querySelectorAll(".prose"));
      for (const root of roots) {
        if (root.getAttribute("data-bible-enhanced") === "true") {
          continue;
        }
        enhanceBibleRefs(root);
        root.setAttribute("data-bible-enhanced", "true");
      }
    };

    enhanceRoots();

    const observer = new MutationObserver(() => {
      enhanceRoots();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function showTooltip(element: HTMLElement, lock: boolean) {
      const passage = element.dataset.passage;
      const reference = element.dataset.ref || passage || "";
      if (!passage) return;

      const storageKey = `${VERSE_CACHE_PREFIX}${passage}`;
      const cachedSession = verseCache.get(passage);
      const persisted = await getOfflineData<VerseCacheEntry>(storageKey);

      const rect = element.getBoundingClientRect();
      const tooltipSize = tooltipRef.current?.getBoundingClientRect();
      const initialPosition = positionTooltip(
        rect,
        tooltipSize?.width || 320,
        tooltipSize?.height || 160,
      );

      if (cachedSession) {
        setState({
          visible: true,
          loading: false,
          locked: lock,
          reference: cachedSession.reference,
          content: cachedSession.content,
          x: initialPosition.x,
          y: initialPosition.y,
        });
      } else if (persisted) {
        verseCache.set(passage, persisted);
        setState({
          visible: true,
          loading: false,
          locked: lock,
          reference: persisted.reference || reference,
          content: persisted.content,
          x: initialPosition.x,
          y: initialPosition.y,
        });
      } else {
        setState((prev) => ({
          ...prev,
          visible: true,
          loading: true,
          locked: lock,
          reference,
          content: "",
          x: initialPosition.x,
          y: initialPosition.y,
        }));
      }

      try {
        const verse = await loadVerseFromAvailableSources(passage, reference);

        verseCache.set(passage, verse);
        void setOfflineData(storageKey, verse);

        const updatedSize = tooltipRef.current?.getBoundingClientRect();
        const { x, y } = positionTooltip(
          rect,
          updatedSize?.width || 320,
          updatedSize?.height || 160,
        );

        setState({
          visible: true,
          loading: false,
          locked: lock,
          reference: verse.reference,
          content: verse.content,
          x,
          y,
        });
      } catch (error) {
        if (cachedSession || persisted) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Unable to load verse.";
        setState({
          visible: true,
          loading: false,
          locked: lock,
          reference,
          content: message,
          x: initialPosition.x,
          y: initialPosition.y,
        });
      }
    }

    function handleClick(event: Event) {
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest('[data-tooltip-close="true"]')) {
        setState((prev) => ({ ...prev, visible: false, locked: false }));
        return;
      }
      if (tooltipRef.current?.contains(target)) {
        return;
      }
      if (!("closest" in target)) {
        if (state.locked) {
          setState((prev) => ({ ...prev, visible: false, locked: false }));
        }
        return;
      }
      const el = target.closest(".bible-ref") as HTMLElement | null;
      if (!el) {
        if (state.locked) {
          setState((prev) => ({ ...prev, visible: false, locked: false }));
        }
        return;
      }
      event.preventDefault();
      const isSame = activeElementRef.current === el;
      showTooltip(el, !state.locked || !isSame);
      activeElementRef.current = el;
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [state.locked]);

  useEffect(() => {
    if (!state.visible) {
      return;
    }

    let rafId = 0;

    const updatePosition = () => {
      const element = activeElementRef.current;
      const tooltip = tooltipRef.current;
      if (!element || !tooltip) {
        return;
      }

      const rect = element.getBoundingClientRect();
      if (
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      ) {
        setState((prev) => ({ ...prev, visible: false, locked: false }));
        return;
      }

      const tooltipRect = tooltip.getBoundingClientRect();
      const { x, y } = positionTooltip(
        rect,
        tooltipRect.width,
        tooltipRect.height,
      );

      setState((prev) =>
        prev.x === x && prev.y === y ? prev : { ...prev, x, y },
      );
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updatePosition();
      });
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, true);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [state.visible, state.locked, state.content, state.reference]);

  if (!state.visible) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      className="bible-tooltip"
      style={{
        position: "fixed",
        left: state.x,
        top: state.y,
        zIndex: 50,
        width: "min(90vw, 420px)",
        background: "var(--background)",
        color: "var(--foreground-bible)",
        border: "1px solid var(--border-color)",
        boxShadow: "0 5px 10px rgba(0, 0, 0, 0.20)",
        fontSize: "0.85rem",
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      <button
        type="button"
        aria-label="Close"
        data-tooltip-close="true"
        onClick={() =>
          setState((prev) => ({ ...prev, visible: false, locked: false }))
        }
        style={{
          position: "absolute",
          top: "-10px",
          right: "-10px",
          width: "24px",
          height: "24px",
          borderRadius: "999px",
          background: "var(--background)",
          color: "var(--foreground-bible)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          lineHeight: 1,
        }}
      >
        <CloseIcon style={{ width: 15, height: 15 }} />
      </button>
      <div
        style={{
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          padding: "12px 14px",
          overflowWrap: "anywhere",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginBottom: "0.4rem",
          }}
        >
          <div className="text-xs font-semibold">{state.reference}</div>
        </div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {state.loading ? (
            <LoadingIndicator className="py-2" size={20} />
          ) : (
            state.content || "No verse found."
          )}
        </div>
      </div>
    </div>
  );
}

function enhanceBibleRefs(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement) continue;
    if (node.parentElement.closest(".bible-ref")) continue;
    textNodes.push(node);
  }

  const pattern = /\(([^()]+?)\)/g;

  for (const node of textNodes) {
    const text = node.textContent || "";
    if (!pattern.test(text)) {
      continue;
    }

    pattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text))) {
      const before = text.slice(lastIndex, match.index);
      if (before) {
        fragment.appendChild(document.createTextNode(before));
      }

      const rawRef = match[1].trim();
      const parsed = parseBibleReference(rawRef);
      if (!parsed) {
        fragment.appendChild(document.createTextNode(match[0]));
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bible-ref";
        button.dataset.passage = parsed.passageId;
        button.dataset.ref = rawRef;
        button.textContent = rawRef;
        fragment.appendChild(button);
      }

      lastIndex = match.index + match[0].length;
    }

    const after = text.slice(lastIndex);
    if (after) {
      fragment.appendChild(document.createTextNode(after));
    }

    if (node.parentNode) {
      node.parentNode.replaceChild(fragment, node);
    }
  }
}

function parsePassageId(passageId: string) {
  const parts = passageId.split(".");
  if (parts.length < 3) return null;
  const [bookCode, chapter, ...rest] = parts;
  const verse = rest.join(".");
  if (!bookCode || !chapter || !verse) return null;
  return { bookCode, chapter, verse };
}

function getBookFileSlug(bookName: string) {
  return bookName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadLocalBooksIndex() {
  if (localBooksIndexPromise) {
    return localBooksIndexPromise;
  }

  localBooksIndexPromise = fetch(`${localBibleBasePath}/Books.json`, {
    cache: "force-cache",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Missing local Books.json");
      }

      const data = (await response.json()) as Array<{
        book?: { english?: string; tamil?: string };
      }>;
      const map = new Map<string, { english?: string; tamil?: string }>();

      for (const entry of data || []) {
        const english = entry.book?.english?.trim();
        if (!english) continue;
        map.set(english.toLowerCase(), entry.book || {});
      }

      return map;
    })
    .catch((error) => {
      localBooksIndexPromise = null;
      throw error;
    });

  return localBooksIndexPromise;
}

async function loadLocalBook(bookName: string) {
  const cacheKey = bookName.toLowerCase();
  const cached = localBookCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const fileSlug = getBookFileSlug(bookName);
  const promise = fetch(
    `${localBibleBasePath}/books/${encodeURIComponent(fileSlug)}.json`,
    {
      cache: "force-cache",
    },
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Missing local book: ${bookName}`);
      }
      return (await response.json()) as LocalBibleBook;
    })
    .catch((error) => {
      localBookCache.delete(cacheKey);
      throw error;
    });

  localBookCache.set(cacheKey, promise);
  return promise;
}

function findLocalVerseText(
  book: LocalBibleBook,
  chapterId: string,
  verseId: string,
) {
  const chapter = book.chapters?.find((entry) => entry.chapter === chapterId);
  if (!chapter) return "";

  const [startStr, endStr] = verseId.split("-");
  const start = Number(startStr);
  const end = endStr ? Number(endStr) : null;

  if (!Number.isFinite(start)) return "";

  if (!end || !Number.isFinite(end)) {
    return chapter.verses.find((verse) => verse.verse === startStr)?.text || "";
  }

  return chapter.verses
    .filter((verse) => {
      const num = Number(verse.verse);
      return Number.isFinite(num) && num >= start && num <= end;
    })
    .map((verse) => verse.text)
    .join(" ");
}

async function loadVerseFromLocalBible(passage: string, fallbackReference: string) {
  const parsedPassage = parsePassageId(passage);
  if (!parsedPassage) {
    throw new Error("Invalid passage format");
  }

  const book = getBookByCode(parsedPassage.bookCode);
  if (!book) {
    throw new Error("Unknown book code");
  }

  const booksIndex = await loadLocalBooksIndex();
  const bookMeta = booksIndex.get(book.name.toLowerCase());
  const localBookName = bookMeta?.english?.trim() || book.name;
  const displayName = bookMeta?.tamil?.trim() || book.name;
  const localBook = await loadLocalBook(localBookName);
  const content = findLocalVerseText(
    localBook,
    parsedPassage.chapter,
    parsedPassage.verse,
  );

  if (!content) {
    throw new Error("Verse not found");
  }

  return {
    reference:
      fallbackReference ||
      `${displayName} ${parsedPassage.chapter}:${parsedPassage.verse}`,
    content,
  };
}

async function loadVerseFromApi(passage: string, fallbackReference: string) {
  const response = await fetch(`/api/bible?passage=${encodeURIComponent(passage)}`, {
    cache: "no-cache",
  });
  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    reference?: string;
    content?: string;
  };

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Unable to load verse.");
  }

  return {
    reference: data.reference || fallbackReference,
    content: data.content || "",
  };
}

async function loadVerseFromAvailableSources(
  passage: string,
  fallbackReference: string,
) {
  try {
    return await loadVerseFromLocalBible(passage, fallbackReference);
  } catch {
    return loadVerseFromApi(passage, fallbackReference);
  }
}
