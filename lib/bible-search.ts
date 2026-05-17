import { Document } from "flexsearch";
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

export type BibleSearchVerse = {
  id: number;
  bookEnglish: string;
  bookTamil: string;
  bookShort: string;
  chapter: string;
  verse: string;
  reference: string;
  text: string;
};

export const BIBLE_SEARCH_VERSES_CACHE_KEY = "local-bible-search-verses:v1";

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

  const books = await loadBibleBooksIndex();
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
        corpus.push({
          id: nextId,
          bookEnglish: book.english,
          bookTamil,
          bookShort,
          chapter: chapter.chapter,
          verse: verse.verse,
          reference: `${bookTamil} ${chapter.chapter}:${verse.verse}`,
          text: verse.text,
        });
        nextId += 1;
      }
    }
  }

  await setOfflineData(BIBLE_SEARCH_VERSES_CACHE_KEY, corpus);
  return corpus;
}

export function createBibleSearchIndex(corpus: BibleSearchVerse[]) {
  const index = new Document<BibleSearchVerse>({
    tokenize: "forward",
    resolution: 9,
    cache: 100,
    document: {
      id: "id",
      index: ["text", "bookTamil", "bookEnglish", "bookShort", "reference"],
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
