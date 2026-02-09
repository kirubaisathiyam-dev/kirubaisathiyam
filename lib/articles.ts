import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { parseBibleReference } from "@/lib/bible";

export type ArticleMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  image?: string;
  summary?: string;
};

export type Article = ArticleMeta & {
  contentHtml: string;
};

const articlesDirectory = path.join(process.cwd(), "content/articles");

type ArticleMetaWithSort = ArticleMeta & {
  sortDate: Date;
};

function getExcerpt(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !line.startsWith("#") &&
        !line.startsWith("!") &&
        !line.startsWith(">"),
    );

  return lines.slice(0, 3).join(" ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replaceBibleRefsInHtml(html: string) {
  return html.replace(/\(([^()]+?)\)/g, (match, inner) => {
    const innerText = inner.replace(/<[^>]+>/g, "").trim();
    const parsed = parseBibleReference(innerText);
    if (!parsed) {
      return match;
    }

    const safeRef = escapeHtml(parsed.reference);
    const safePassage = escapeHtml(parsed.passageId);

    return `(<button type="button" class="bible-ref" data-passage="${safePassage}" data-ref="${safeRef}">${safeRef}</button>)`;
  });
}

function getCoverImage(content: string, data: { image?: unknown }) {
  if (typeof data.image === "string" && data.image.trim()) {
    return data.image.trim();
  }

  const match = content.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  if (match?.[1]) {
    return match[1];
  }

  return "";
}

function parseDate(value: unknown, fallback: Date) {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  return fallback;
}

function readArticleMeta(fileName: string): ArticleMetaWithSort {
  const slug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(articlesDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const stats = fs.statSync(fullPath);
  const { title, date, author } = data as {
    title?: unknown;
    date?: unknown;
    author?: unknown;
    image?: unknown;
    summary?: unknown;
  };
  const parsedDate = parseDate(date, stats.mtime);
  const image = getCoverImage(content, { image: data?.image });
  const summary = typeof data?.summary === "string" ? data.summary : "";

  return {
    slug,
    title: typeof title === "string" ? title : "",
    date:
      typeof date === "string"
        ? date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof author === "string" ? author : "",
    excerpt: summary || getExcerpt(content),
    image: image || undefined,
    summary: summary || undefined,
    sortDate: parsedDate,
  };
}

export function getAllArticles(): ArticleMeta[] {
  const fileNames = fs
    .readdirSync(articlesDirectory)
    .filter((fileName) => fileName.endsWith(".md"));

  const articles = fileNames.map((fileName) => readArticleMeta(fileName));

  return articles
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .map(({ sortDate, ...article }) => article);
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const { data, content } = matter(fileContents);
  const stats = fs.statSync(fullPath);
  const { title, date, author } = data as {
    title?: unknown;
    date?: unknown;
    author?: unknown;
    image?: unknown;
    summary?: unknown;
  };
  const parsedDate = parseDate(date, stats.mtime);
  const image = getCoverImage(content, { image: data?.image });
  const summary = typeof data?.summary === "string" ? data.summary : "";

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(content);
  const contentHtml = replaceBibleRefsInHtml(processedContent.toString());

  return {
    slug,
    title: typeof title === "string" ? title : "",
    date:
      typeof date === "string"
        ? date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof author === "string" ? author : "",
    excerpt: summary || getExcerpt(content),
    image: image || undefined,
    summary: summary || undefined,
    contentHtml,
  };
}
