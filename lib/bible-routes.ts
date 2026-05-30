import { getBookFileSlug } from "@/lib/local-bible";

export function normalizeVerseSelectionForPath(verses: string) {
  return verses.trim().replace(/,/g, "_");
}

export function buildBiblePath(params: {
  book: string;
  chapter: string;
  verses?: string | null;
}) {
  const base = `/bible/${getBookFileSlug(params.book)}/${params.chapter}`;
  const verses = params.verses?.trim();
  return verses ? `${base}/${normalizeVerseSelectionForPath(verses)}` : base;
}
