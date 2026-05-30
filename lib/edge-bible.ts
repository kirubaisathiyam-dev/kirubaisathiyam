import { headers } from "next/headers";
import booksIndex from "@/public/local-bible/Books.json";
import {
  getBookFileSlug,
  mapBookEntries,
  type BookIndexEntry,
  type LocalBibleBook,
} from "@/lib/local-bible";
import { getSiteUrl } from "@/lib/seo";

const bibleBooksIndex = mapBookEntries(booksIndex as BookIndexEntry[]).map(
  (entry) => ({
    ...entry,
    slug: getBookFileSlug(entry.english),
  }),
);

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "development" ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return getSiteUrl().toString().replace(/\/+$/, "");
}

export async function getEdgeBibleBookDataBySlug(slug: string) {
  const meta = bibleBooksIndex.find((entry) => entry.slug === slug) ?? null;

  if (!meta) {
    return null;
  }

  const origin = await getRequestOrigin();
  const response = await fetch(`${origin}/local-bible/books/${meta.slug}.json`, {
    cache: "force-cache",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as LocalBibleBook;

  return {
    meta,
    data,
  };
}
