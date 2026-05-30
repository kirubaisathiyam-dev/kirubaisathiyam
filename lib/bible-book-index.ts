import booksIndex from "@/public/local-bible/Books.json";
import {
  getBookFileSlug,
  mapBookEntries,
  type BookIndexEntry,
} from "@/lib/local-bible";

export const bibleBooksIndex = mapBookEntries(booksIndex as BookIndexEntry[]).map(
  (entry) => ({
    ...entry,
    slug: getBookFileSlug(entry.english),
  }),
);

export function getBibleBookIndexEntryBySlug(slug: string) {
  return bibleBooksIndex.find((entry) => entry.slug === slug) ?? null;
}
