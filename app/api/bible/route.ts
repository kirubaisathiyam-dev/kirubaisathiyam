import { NextResponse } from "next/server";
import { getBookByCode, parseBibleReference } from "@/lib/bible";

export const runtime = "edge";

const defaultBibleId =
  process.env.YOUVERSION_BIBLE_ID || process.env.YVP_BIBLE_ID || "339";
const defaultSource = (process.env.BIBLE_SOURCE || "local").toLowerCase();
const localBibleBasePath = "/local-bible";

function getBookFileSlug(bookName: string) {
  return bookName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

const localBookCache = new Map<string, Promise<LocalBibleBook>>();
let localBooksIndexPromise:
  | Promise<Map<string, { english?: string; tamil?: string }>>
  | null = null;

function parsePassageId(passageId: string) {
  const parts = passageId.split(".");
  if (parts.length < 3) return null;
  const [bookCode, chapter, ...rest] = parts;
  const verse = rest.join(".");
  if (!bookCode || !chapter || !verse) return null;
  return { bookCode, chapter, verse };
}

async function loadLocalBook(bookName: string, requestUrl: string) {
  const cacheKey = bookName.toLowerCase();
  const cached = localBookCache.get(cacheKey);
  if (cached) return cached;

  const fileSlug = getBookFileSlug(bookName);
  const bookUrl = new URL(
    `${localBibleBasePath}/books/${encodeURIComponent(fileSlug)}.json`,
    requestUrl,
  );

  const promise = fetch(bookUrl.toString())
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

async function loadLocalBooksIndex(requestUrl: string) {
  if (localBooksIndexPromise) return localBooksIndexPromise;

  const indexUrl = new URL(`${localBibleBasePath}/Books.json`, requestUrl);
  localBooksIndexPromise = fetch(indexUrl.toString())
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

function findLocalVerseText(
  book: LocalBibleBook,
  chapterId: string,
  verseId: string,
) {
  const chapter = book.chapters?.find(
    (entry) => entry.chapter === chapterId,
  );
  if (!chapter) return "";

  const [startStr, endStr] = verseId.split("-");
  const start = Number(startStr);
  const end = endStr ? Number(endStr) : null;

  if (!Number.isFinite(start)) return "";

  if (!end || !Number.isFinite(end)) {
    return (
      chapter.verses.find((verse) => verse.verse === startStr)?.text || ""
    );
  }

  return chapter.verses
    .filter((verse) => {
      const num = Number(verse.verse);
      return Number.isFinite(num) && num >= start && num <= end;
    })
    .map((verse) => verse.text)
    .join(" ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const passage = searchParams.get("passage");
  const ref = searchParams.get("ref");
  const source = (searchParams.get("source") || defaultSource).toLowerCase();

  let passageId = passage;
  let reference = ref || "";

  if (!passageId) {
    const parsed = ref ? parseBibleReference(ref) : null;
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "Invalid reference" },
        { status: 400 },
      );
    }
    passageId = parsed.passageId;
    reference = parsed.reference;
  }

  if (source !== "youversion" && source !== "yvp") {
    const parsed = parsePassageId(passageId);
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "Invalid passage format" },
        { status: 400 },
      );
    }

    const book = getBookByCode(parsed.bookCode);
    if (!book) {
      return NextResponse.json(
        { ok: false, error: "Unknown book code" },
        { status: 400 },
      );
    }

    try {
      const booksIndex = await loadLocalBooksIndex(request.url);
      const bookMeta = booksIndex.get(book.name.toLowerCase());
      const localBookName = bookMeta?.english?.trim() || book.name;
      const displayName = bookMeta?.tamil?.trim() || book.name;

      const localBook = await loadLocalBook(localBookName, request.url);
      const content = findLocalVerseText(
        localBook,
        parsed.chapter,
        parsed.verse,
      );

      if (!content) {
        return NextResponse.json(
          { ok: false, error: "Verse not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        ok: true,
        id: passageId,
        content,
        reference:
          reference || `${displayName} ${parsed.chapter}:${parsed.verse}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local error";
      return NextResponse.json(
        { ok: false, error: message },
        { status: 500 },
      );
    }
  }

  const apiKey = process.env.YVP_APP_KEY || process.env.YOUVERSION_APP_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing YVP_APP_KEY" },
      { status: 500 },
    );
  }

  const bibleId = searchParams.get("bibleId") || defaultBibleId;

  const response = await fetch(
    `https://api.youversion.com/v1/bibles/${encodeURIComponent(
      bibleId,
    )}/passages/${encodeURIComponent(passageId)}`,
    {
      headers: {
        "x-yvp-app-key": apiKey,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { ok: false, error: errorText || "Failed to fetch verse" },
      { status: 502 },
    );
  }

  const data = (await response.json()) as {
    id?: string;
    content?: string;
    reference?: string;
  };

  return NextResponse.json({
    ok: true,
    id: data.id || passageId,
    content: data.content || "",
    reference: data.reference || reference || passageId,
  });
}
