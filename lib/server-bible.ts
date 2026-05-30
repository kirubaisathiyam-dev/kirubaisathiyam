import fs from "node:fs/promises";
import path from "node:path";
import {
  getBookFileSlug,
  mapBookEntries,
  type BookIndexEntry,
  type BookMeta,
  type LocalBibleBook,
} from "@/lib/local-bible";

export type BibleBookIndexItem = BookMeta & {
  slug: string;
};

const localBibleDirectory = path.join(process.cwd(), "public", "local-bible");
const booksIndexPath = path.join(localBibleDirectory, "Books.json");

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

export async function getBibleBooksIndex(): Promise<BibleBookIndexItem[]> {
  const entries = await readJsonFile<BookIndexEntry[]>(booksIndexPath);

  return mapBookEntries(entries).map((entry) => ({
    ...entry,
    slug: getBookFileSlug(entry.english),
  }));
}

export async function getBibleBookMetaBySlug(slug: string) {
  const books = await getBibleBooksIndex();
  return books.find((book) => book.slug === slug) ?? null;
}

export async function getBibleBookDataBySlug(slug: string) {
  const meta = await getBibleBookMetaBySlug(slug);
  if (!meta) {
    return null;
  }

  const filePath = path.join(localBibleDirectory, "books", `${meta.slug}.json`);

  try {
    const data = await readJsonFile<LocalBibleBook>(filePath);
    return {
      meta,
      data,
    };
  } catch {
    return null;
  }
}
