import fs from "fs";
import path from "path";
import {
  getCoverImage,
  getExcerpt,
  listMarkdownFiles,
  listMarkdownFilesRecursive,
  normalizeStringList,
  parseDate,
  parseMarkdownFile,
  renderMarkdown,
} from "@/lib/content-utils";

const booksMetaDirectory = path.join(process.cwd(), "content/books/meta");
const booksChaptersDirectory = path.join(process.cwd(), "content/books/chapters");

export const BOOKS_SECTION = {
  slug: "books",
  image: "/images/history.jpg",
  label: "Books",
  description:
    "Christian books in Tamil with a book introduction, cover, and chapter-by-chapter reading experience.",
} as const;

export type BookMeta = {
  slug: string;
  title: string;
  author: string;
  date: string;
  summary: string;
  credits?: string;
  image?: string;
  keywords: string[];
  chapterCount: number;
  sectionCount: number;
  latestDate?: string;
};

export type BookSectionChapterMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  order: number;
  excerpt: string;
  image?: string;
  bookSlug: string;
  bookTitle: string;
  sectionSlug: string | null;
  sectionLabel: string | null;
};

export type BookChapter = BookSectionChapterMeta & {
  contentHtml: string;
};

export type BookSection = {
  slug: string;
  label: string;
  chapterCount: number;
  latestDate?: string;
  chapters: BookSectionChapterMeta[];
};

export type Book = BookMeta & {
  creditsHtml?: string;
  directChapters: BookSectionChapterMeta[];
  sections: BookSection[];
};

type BookMetaWithSort = BookMeta & {
  sortDate: Date;
};

type BookSectionChapterMetaWithSort = BookSectionChapterMeta & {
  sortDate: Date;
};

function parseOrder(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function createSlug(value: unknown, fallback = "general") {
  if (typeof value === "string" && value.trim()) {
    const cleaned = value
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "");

    if (cleaned) {
      return cleaned;
    }
  }

  return fallback;
}

function formatLabel(value: string) {
  const normalized = value.replace(/[-_]+/g, " ").trim();

  if (!normalized) {
    return "General";
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function readBookMeta(fileName: string): BookMetaWithSort {
  const slug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(booksMetaDirectory, fileName);
  const { data, content, stats } = parseMarkdownFile(fullPath);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const summary =
    typeof data.summary === "string" && data.summary.trim()
      ? data.summary.trim()
      : getExcerpt(content);
  const credits =
    typeof data.credits === "string" && data.credits.trim()
      ? data.credits.trim()
      : "";

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    author: typeof data.author === "string" ? data.author : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    summary,
    credits: credits || undefined,
    image: image || undefined,
    keywords: normalizeStringList(data.keywords),
    chapterCount: 0,
    sectionCount: 0,
    latestDate: undefined,
    sortDate: parsedDate,
  };
}

function getBookMetaIndex() {
  return new Map(
    listMarkdownFiles(booksMetaDirectory).map((fileName) => {
      const book = readBookMeta(fileName);
      return [book.slug, book] as const;
    }),
  );
}

function readBookChapterMeta(
  relativePath: string,
  bookMetaIndex = getBookMetaIndex(),
): BookSectionChapterMetaWithSort {
  const slug = path.basename(relativePath, ".md");
  const fullPath = path.join(booksChaptersDirectory, relativePath);
  const { data, content, stats } = parseMarkdownFile(fullPath);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const directory = path.dirname(relativePath).replace(/\\/g, "/");
  const segments = directory === "." ? [] : directory.split("/");
  const bookSlug = segments[0] || createSlug(data.bookFolder, "book");
  const bookMeta = bookMetaIndex.get(bookSlug);
  const rawSectionSlug =
    segments[1] ||
    (typeof data.section === "string" && data.section.trim()
      ? createSlug(data.sectionFolder ?? data.section, "section")
      : "");
  const sectionSlug = rawSectionSlug || null;

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: bookMeta?.author || "",
    order: parseOrder(data.order),
    excerpt: getExcerpt(content),
    image: image || undefined,
    bookSlug,
    bookTitle: bookMeta?.title || formatLabel(bookSlug),
    sectionSlug,
    sectionLabel:
      typeof data.section === "string" && data.section.trim()
        ? data.section.trim()
        : sectionSlug
          ? formatLabel(sectionSlug)
          : null,
    sortDate: parsedDate,
  };
}

function compareChapters(
  a: BookSectionChapterMetaWithSort,
  b: BookSectionChapterMetaWithSort,
) {
  if (a.bookTitle !== b.bookTitle) {
    return a.bookTitle.localeCompare(b.bookTitle);
  }

  if ((a.sectionLabel || "") !== (b.sectionLabel || "")) {
    return (a.sectionLabel || "").localeCompare(b.sectionLabel || "");
  }

  if (a.order !== b.order) {
    return a.order - b.order;
  }

  if (a.title !== b.title) {
    return a.title.localeCompare(b.title);
  }

  return a.sortDate.getTime() - b.sortDate.getTime();
}

export function getAllBookChapters(): BookSectionChapterMeta[] {
  const bookMetaIndex = getBookMetaIndex();

  return listMarkdownFilesRecursive(booksChaptersDirectory)
    .map((relativePath) => readBookChapterMeta(relativePath, bookMetaIndex))
    .sort(compareChapters)
    .map((chapter) => ({
      slug: chapter.slug,
      title: chapter.title,
      date: chapter.date,
      author: chapter.author,
      order: chapter.order,
      excerpt: chapter.excerpt,
      image: chapter.image,
      bookSlug: chapter.bookSlug,
      bookTitle: chapter.bookTitle,
      sectionSlug: chapter.sectionSlug,
      sectionLabel: chapter.sectionLabel,
    }));
}

export function getAllBooks(): BookMeta[] {
  const chapters = getAllBookChapters();
  const chapterStats = new Map<
    string,
    { chapterCount: number; sectionSet: Set<string>; latestDate?: string }
  >();

  for (const chapter of chapters) {
    const stats = chapterStats.get(chapter.bookSlug) ?? {
      chapterCount: 0,
      sectionSet: new Set<string>(),
      latestDate: undefined,
    };
    stats.chapterCount += 1;
    if (chapter.sectionSlug) {
      stats.sectionSet.add(chapter.sectionSlug);
    }
    if (
      !stats.latestDate ||
      new Date(chapter.date).getTime() > new Date(stats.latestDate).getTime()
    ) {
      stats.latestDate = chapter.date;
    }
    chapterStats.set(chapter.bookSlug, stats);
  }

  return listMarkdownFiles(booksMetaDirectory)
    .map((fileName) => readBookMeta(fileName))
    .map((book) => {
      const stats = chapterStats.get(book.slug);
      const latestDate = stats?.latestDate || book.date;

      return {
        slug: book.slug,
        title: book.title,
        author: book.author,
        date: book.date,
        summary: book.summary,
        credits: book.credits,
        image: book.image,
        keywords: book.keywords,
        chapterCount: stats?.chapterCount ?? 0,
        sectionCount: stats?.sectionSet.size ?? 0,
        latestDate,
        sortDate: latestDate ? new Date(latestDate) : book.sortDate,
      };
    })
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .map((book) => ({
      slug: book.slug,
      title: book.title,
      author: book.author,
      date: book.date,
      summary: book.summary,
      credits: book.credits,
      image: book.image,
      keywords: book.keywords,
      chapterCount: book.chapterCount,
      sectionCount: book.sectionCount,
      latestDate: book.latestDate,
    }));
}

export async function getBookBySlug(bookSlug: string): Promise<Book | null> {
  const fullPath = path.join(booksMetaDirectory, `${bookSlug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const { data, content, stats } = parseMarkdownFile(fullPath);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const summary =
    typeof data.summary === "string" && data.summary.trim()
      ? data.summary.trim()
      : getExcerpt(content);
  const credits =
    typeof data.credits === "string" && data.credits.trim()
      ? data.credits.trim()
      : "";
  const creditsHtml = credits ? await renderMarkdown(credits) : undefined;
  const chapters = getAllBookChapters().filter((chapter) => chapter.bookSlug === bookSlug);
  const directChapters: BookSectionChapterMeta[] = [];
  const groupedSections = new Map<string, BookSection>();
  let latestChapterDate: string | undefined;

  for (const chapter of chapters) {
    if (
      !latestChapterDate ||
      new Date(chapter.date).getTime() > new Date(latestChapterDate).getTime()
    ) {
      latestChapterDate = chapter.date;
    }

    if (!chapter.sectionSlug) {
      directChapters.push(chapter);
      continue;
    }

    const sectionSlug = chapter.sectionSlug;
    let section = groupedSections.get(sectionSlug);

    if (!section) {
      section = {
        slug: sectionSlug,
        label: chapter.sectionLabel || formatLabel(sectionSlug),
        chapterCount: 0,
        latestDate: chapter.date,
        chapters: [],
      };
      groupedSections.set(sectionSlug, section);
    }

    section.chapterCount += 1;
    if (
      !section.latestDate ||
      new Date(chapter.date).getTime() > new Date(section.latestDate).getTime()
    ) {
      section.latestDate = chapter.date;
    }
    section.chapters.push(chapter);
  }

  const sections = Array.from(groupedSections.values())
    .map((section) => ({
      ...section,
      chapters: section.chapters.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }

        return a.title.localeCompare(b.title);
      }),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    slug: bookSlug,
    title: typeof data.title === "string" ? data.title : "",
    author: typeof data.author === "string" ? data.author : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    summary,
    credits: credits || undefined,
    image: image || undefined,
    keywords: normalizeStringList(data.keywords),
    chapterCount: chapters.length,
    sectionCount: sections.length,
    latestDate:
      latestChapterDate ||
      (typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10)),
    creditsHtml,
    directChapters: directChapters.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      return a.title.localeCompare(b.title);
    }),
    sections,
  };
}

export async function getBookChapter(
  bookSlug: string,
  slug: string,
  sectionSlug?: string | null,
): Promise<BookChapter | null> {
  let fullPath = sectionSlug
    ? path.join(booksChaptersDirectory, bookSlug, sectionSlug, `${slug}.md`)
    : path.join(booksChaptersDirectory, bookSlug, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    if (!sectionSlug) {
      return null;
    }

    fullPath = path.join(booksChaptersDirectory, bookSlug, `${slug}.md`);
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const { data, content, stats } = parseMarkdownFile(fullPath);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const contentHtml = await renderMarkdown(content);
  const bookMeta = getBookMetaIndex().get(bookSlug);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: bookMeta?.author || "",
    order: parseOrder(data.order),
    excerpt: getExcerpt(content),
    image: image || undefined,
    bookSlug,
    bookTitle: bookMeta?.title || formatLabel(bookSlug),
    sectionSlug:
      typeof data.section === "string" && data.section.trim()
        ? createSlug(data.sectionFolder ?? data.section, "section")
        : sectionSlug || null,
    sectionLabel:
      typeof data.section === "string" && data.section.trim()
        ? data.section.trim()
        : sectionSlug
          ? formatLabel(sectionSlug)
          : null,
    contentHtml,
  };
}
