import booksIndex from "@/public/local-bible/Books.json";
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

const bookModules = {
  "1-chronicles": () => import("@/public/local-bible/books/1-chronicles.json"),
  "1-corinthians": () => import("@/public/local-bible/books/1-corinthians.json"),
  "1-john": () => import("@/public/local-bible/books/1-john.json"),
  "1-kings": () => import("@/public/local-bible/books/1-kings.json"),
  "1-peter": () => import("@/public/local-bible/books/1-peter.json"),
  "1-samuel": () => import("@/public/local-bible/books/1-samuel.json"),
  "1-thessalonians": () =>
    import("@/public/local-bible/books/1-thessalonians.json"),
  "1-timothy": () => import("@/public/local-bible/books/1-timothy.json"),
  "2-chronicles": () => import("@/public/local-bible/books/2-chronicles.json"),
  "2-corinthians": () =>
    import("@/public/local-bible/books/2-corinthians.json"),
  "2-john": () => import("@/public/local-bible/books/2-john.json"),
  "2-kings": () => import("@/public/local-bible/books/2-kings.json"),
  "2-peter": () => import("@/public/local-bible/books/2-peter.json"),
  "2-samuel": () => import("@/public/local-bible/books/2-samuel.json"),
  "2-thessalonians": () =>
    import("@/public/local-bible/books/2-thessalonians.json"),
  "2-timothy": () => import("@/public/local-bible/books/2-timothy.json"),
  "3-john": () => import("@/public/local-bible/books/3-john.json"),
  acts: () => import("@/public/local-bible/books/acts.json"),
  amos: () => import("@/public/local-bible/books/amos.json"),
  colossians: () => import("@/public/local-bible/books/colossians.json"),
  daniel: () => import("@/public/local-bible/books/daniel.json"),
  deuteronomy: () => import("@/public/local-bible/books/deuteronomy.json"),
  ecclesiastes: () => import("@/public/local-bible/books/ecclesiastes.json"),
  ephesians: () => import("@/public/local-bible/books/ephesians.json"),
  esther: () => import("@/public/local-bible/books/esther.json"),
  exodus: () => import("@/public/local-bible/books/exodus.json"),
  ezekiel: () => import("@/public/local-bible/books/ezekiel.json"),
  ezra: () => import("@/public/local-bible/books/ezra.json"),
  galatians: () => import("@/public/local-bible/books/galatians.json"),
  genesis: () => import("@/public/local-bible/books/genesis.json"),
  habakkuk: () => import("@/public/local-bible/books/habakkuk.json"),
  haggai: () => import("@/public/local-bible/books/haggai.json"),
  hebrews: () => import("@/public/local-bible/books/hebrews.json"),
  hosea: () => import("@/public/local-bible/books/hosea.json"),
  isaiah: () => import("@/public/local-bible/books/isaiah.json"),
  james: () => import("@/public/local-bible/books/james.json"),
  jeremiah: () => import("@/public/local-bible/books/jeremiah.json"),
  job: () => import("@/public/local-bible/books/job.json"),
  joel: () => import("@/public/local-bible/books/joel.json"),
  john: () => import("@/public/local-bible/books/john.json"),
  jonah: () => import("@/public/local-bible/books/jonah.json"),
  joshua: () => import("@/public/local-bible/books/joshua.json"),
  jude: () => import("@/public/local-bible/books/jude.json"),
  judges: () => import("@/public/local-bible/books/judges.json"),
  lamentations: () => import("@/public/local-bible/books/lamentations.json"),
  leviticus: () => import("@/public/local-bible/books/leviticus.json"),
  luke: () => import("@/public/local-bible/books/luke.json"),
  malachi: () => import("@/public/local-bible/books/malachi.json"),
  mark: () => import("@/public/local-bible/books/mark.json"),
  matthew: () => import("@/public/local-bible/books/matthew.json"),
  micah: () => import("@/public/local-bible/books/micah.json"),
  nahum: () => import("@/public/local-bible/books/nahum.json"),
  nehemiah: () => import("@/public/local-bible/books/nehemiah.json"),
  numbers: () => import("@/public/local-bible/books/numbers.json"),
  obadiah: () => import("@/public/local-bible/books/obadiah.json"),
  philemon: () => import("@/public/local-bible/books/philemon.json"),
  philippians: () => import("@/public/local-bible/books/philippians.json"),
  proverbs: () => import("@/public/local-bible/books/proverbs.json"),
  psalms: () => import("@/public/local-bible/books/psalms.json"),
  revelation: () => import("@/public/local-bible/books/revelation.json"),
  romans: () => import("@/public/local-bible/books/romans.json"),
  ruth: () => import("@/public/local-bible/books/ruth.json"),
  "song-of-songs": () => import("@/public/local-bible/books/song-of-songs.json"),
  titus: () => import("@/public/local-bible/books/titus.json"),
  zechariah: () => import("@/public/local-bible/books/zechariah.json"),
  zephaniah: () => import("@/public/local-bible/books/zephaniah.json"),
} satisfies Record<string, () => Promise<{ default: LocalBibleBook }>>;

export async function getBibleBooksIndex(): Promise<BibleBookIndexItem[]> {
  return mapBookEntries(booksIndex as BookIndexEntry[]).map((entry) => ({
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
  const loader = bookModules[slug as keyof typeof bookModules];

  if (!meta || !loader) {
    return null;
  }

  try {
    const bookModule = await loader();
    return {
      meta,
      data: bookModule.default as LocalBibleBook,
    };
  } catch {
    return null;
  }
}
