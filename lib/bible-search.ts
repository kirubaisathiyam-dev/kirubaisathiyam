import { Document } from "flexsearch";
import { parseBibleReference } from "@/lib/bible";
import {
  BOOKS_CACHE_KEY,
  BOOK_CACHE_PREFIX,
  getBookFileSlug,
  mapBookEntries,
  type BookIndexEntry,
  type BookMeta,
  type LocalBibleBook,
} from "@/lib/local-bible";
import { fetchWithOffline, getOfflineData, setOfflineData } from "@/lib/offline";

type BibleNote = {
  id?: string;
  position: string;
  title?: string;
  text?: string;
  image?: string;
};

export type BibleSearchVerse = {
  id: number;
  bookEnglish: string;
  bookTamil: string;
  bookShort: string;
  chapter: string;
  verse: string;
  reference: string;
  text: string;
  noteTitle: string;
  noteText: string;
};

const NOTES_CACHE_KEY = "bible-notes";
export const BIBLE_SEARCH_VERSES_CACHE_KEY = "local-bible-search-verses:v2";

function normalizeNoteText(value: string) {
  return value
    .replace(/\*\*/g, " ")
    .replace(/[_#>`~-]+/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\(([^()]+?)\)/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadBibleNotes() {
  const cachedNotes = await getOfflineData<BibleNote[]>(NOTES_CACHE_KEY);
  if (cachedNotes?.length) {
    return cachedNotes;
  }

  return fetchWithOffline<BibleNote[]>(NOTES_CACHE_KEY, async () => {
    const response = await fetch("/bible-notes.json", {
      cache: "no-cache",
    });
    if (!response.ok) {
      throw new Error("Unable to load bible notes.");
    }
    const data = (await response.json()) as BibleNote[];
    return Array.isArray(data) ? data : [];
  });
}

function buildNotesByVerse(notes: BibleNote[]) {
  const noteMap = new Map<string, { titles: string[]; texts: string[] }>();

  for (const note of notes) {
    if (!note.position) {
      continue;
    }

    const parsed = parseBibleReference(note.position);
    if (!parsed) {
      continue;
    }

    const entry = noteMap.get(parsed.passageId) || { titles: [], texts: [] };
    const title = typeof note.title === "string" ? normalizeNoteText(note.title) : "";
    const text = typeof note.text === "string" ? normalizeNoteText(note.text) : "";

    if (title) {
      entry.titles.push(title);
    }
    if (text) {
      entry.texts.push(text);
    }

    noteMap.set(parsed.passageId, entry);
  }

  return noteMap;
}

async function loadBibleBooksIndex() {
  const cachedBooks = await getOfflineData<BookMeta[]>(BOOKS_CACHE_KEY);
  if (cachedBooks?.length) {
    return cachedBooks;
  }

  return fetchWithOffline<BookMeta[]>(BOOKS_CACHE_KEY, async () => {
    const response = await fetch("/local-bible/Books.json", {
      cache: "no-cache",
    });
    if (!response.ok) {
      throw new Error("Unable to load bible books.");
    }
    const data = (await response.json()) as BookIndexEntry[];
    return mapBookEntries(data);
  });
}

async function loadBibleBook(bookEnglish: string) {
  const slug = getBookFileSlug(bookEnglish);
  const cacheKey = `${BOOK_CACHE_PREFIX}${slug}`;

  return fetchWithOffline<LocalBibleBook>(cacheKey, async () => {
    const response = await fetch(
      `/local-bible/books/${encodeURIComponent(slug)}.json`,
      { cache: "no-cache" },
    );
    if (!response.ok) {
      throw new Error(`Unable to load ${bookEnglish}`);
    }
    return (await response.json()) as LocalBibleBook;
  });
}

export async function loadBibleSearchCorpus() {
  const cachedCorpus = await getOfflineData<BibleSearchVerse[]>(
    BIBLE_SEARCH_VERSES_CACHE_KEY,
  );
  if (cachedCorpus?.length) {
    return cachedCorpus;
  }

  const [books, notes] = await Promise.all([
    loadBibleBooksIndex(),
    loadBibleNotes(),
  ]);
  const notesByVerse = buildNotesByVerse(notes);
  const bookDataList = await Promise.all(
    books.map(async (book) => ({
      book,
      bookData: await loadBibleBook(book.english),
    })),
  );

  const corpus: BibleSearchVerse[] = [];
  let nextId = 1;

  for (const { book, bookData } of bookDataList) {
    const bookTamil =
      book.tamil?.trim() || bookData.book?.tamil?.trim() || book.english;
    const bookShort =
      book.short?.trim() || bookData.book?.short?.trim() || bookTamil;

    for (const chapter of bookData.chapters || []) {
      for (const verse of chapter.verses || []) {
        const noteKey = `${bookCodeFromEnglish(book.english)}.${chapter.chapter}.${verse.verse}`;
        const verseNotes = notesByVerse.get(noteKey);
        corpus.push({
          id: nextId,
          bookEnglish: book.english,
          bookTamil,
          bookShort,
          chapter: chapter.chapter,
          verse: verse.verse,
          reference: `${bookTamil} ${chapter.chapter}:${verse.verse}`,
          text: verse.text,
          noteTitle: verseNotes?.titles.join(" ") || "",
          noteText: verseNotes?.texts.join(" ") || "",
        });
        nextId += 1;
      }
    }
  }

  await setOfflineData(BIBLE_SEARCH_VERSES_CACHE_KEY, corpus);
  return corpus;
}

function bookCodeFromEnglish(bookEnglish: string) {
  const parsed = parseBibleReference(`${bookEnglish} 1:1`);
  return parsed?.passageId.split(".")[0] || "";
}

export function createBibleSearchIndex(corpus: BibleSearchVerse[]) {
  const index = new Document<BibleSearchVerse>({
    tokenize: "forward",
    resolution: 9,
    cache: 100,
    document: {
      id: "id",
      index: [
        "text",
        "noteTitle",
        "noteText",
        "bookTamil",
        "bookEnglish",
        "bookShort",
        "reference",
      ],
      store: true,
    },
  });

  corpus.forEach((entry) => {
    index.add(entry);
  });

  return index;
}

export function searchBibleIndex(
  index: Document<BibleSearchVerse>,
  query: string,
  limit = 80,
) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const results = index.search(trimmedQuery, {
    limit,
    enrich: true,
    merge: true,
  });

  return results
    .map((entry) => entry.doc)
    .filter((entry): entry is BibleSearchVerse => Boolean(entry));
}
