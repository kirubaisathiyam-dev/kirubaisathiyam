import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type AdminArticle = {
  slug: string;
  title: string;
  date: string;
  content: string;
  summary?: string;
  image?: string;
};

type ArticleRecord = AdminArticle & {
  sortDate: Date;
};

const articlesDirectory = path.join(process.cwd(), "content", "articles");

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

export function loadAdminArticles(): AdminArticle[] {
  if (!fs.existsSync(articlesDirectory)) {
    return [];
  }

  const fileNames = fs
    .readdirSync(articlesDirectory)
    .filter((fileName) => fileName.endsWith(".md"));

  const records: ArticleRecord[] = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const stats = fs.statSync(fullPath);
    const parsedDate = parseDate(data?.date, stats.mtime);
    const dateLabel =
      typeof data?.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10);
    const summary = typeof data?.summary === "string" ? data.summary : "";
    const image = getCoverImage(content, { image: data?.image });

    return {
      slug,
      title: typeof data?.title === "string" ? data.title : slug,
      date: dateLabel,
      content,
      summary: summary || getExcerpt(content),
      image: image || undefined,
      sortDate: parsedDate,
    };
  });

  return records
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      date: article.date,
      content: article.content,
      summary: article.summary,
      image: article.image,
    }));
}
