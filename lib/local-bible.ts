export type BookIndexEntry = {
  book?: {
    english?: string;
    tamil?: string;
    short?: string;
  };
};

export type BookMeta = {
  english: string;
  tamil?: string;
  short?: string;
};

export type LocalBibleBook = {
  book?: {
    english?: string;
    tamil?: string;
    short?: string;
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

export const DEFAULT_BIBLE_BOOK = "Genesis";
export const BOOKS_CACHE_KEY = "local-bible-books";
export const BOOK_CACHE_PREFIX = "local-book:";

export function getBookFileSlug(bookName: string) {
  return bookName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mapBookEntries(entries: BookIndexEntry[]): BookMeta[] {
  return (entries || [])
    .map((entry) => ({
      english: entry.book?.english?.trim() || "",
      tamil: entry.book?.tamil?.trim(),
      short: entry.book?.short?.trim(),
    }))
    .filter((entry) => Boolean(entry.english));
}
