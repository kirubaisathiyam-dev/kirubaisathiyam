import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { replaceBibleRefsInHtml } from "@/lib/bible";

export type MarkdownFrontmatter = {
  title?: unknown;
  date?: unknown;
  author?: unknown;
  image?: unknown;
  summary?: unknown;
  tags?: unknown;
  keywords?: unknown;
  audio?: unknown;
  order?: unknown;
  subsection?: unknown;
  subsectionFolder?: unknown;
};

export function listMarkdownFiles(directory: string) {
  try {
    return fs
      .readdirSync(directory)
      .filter((fileName) => fileName.toLowerCase().endsWith(".md"));
  } catch {
    return [];
  }
}

export function listMarkdownFilesRecursive(
  directory: string,
  baseDirectory = directory,
): string[] {
  try {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listMarkdownFilesRecursive(fullPath, baseDirectory);
      }

      if (!entry.name.toLowerCase().endsWith(".md")) {
        return [];
      }

      return [path.relative(baseDirectory, fullPath)];
    });
  } catch {
    return [];
  }
}

export function parseMarkdownFile(fullPath: string) {
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const stats = fs.statSync(fullPath);
  const { data, content } = matter(fileContents);

  return {
    data: data as MarkdownFrontmatter & Record<string, unknown>,
    content,
    stats,
  };
}

export function getExcerpt(content: string) {
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

export function normalizeStringList(value: unknown) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const seen = new Set<string>();

  return items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function getCoverImage(content: string, data: { image?: unknown }) {
  if (typeof data.image === "string" && data.image.trim()) {
    return data.image.trim();
  }

  const match = content.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  if (match?.[1]) {
    return match[1];
  }

  return "";
}

export function getAudioPath(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function parseDate(value: unknown, fallback: Date) {
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

export async function renderMarkdown(content: string) {
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(content);

  return replaceBibleRefsInHtml(processedContent.toString());
}
