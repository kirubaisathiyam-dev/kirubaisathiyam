import path from "path";
import {
  getAudioPath,
  getCoverImage,
  getExcerpt,
  listMarkdownFiles,
  normalizeStringList,
  parseDate,
  parseMarkdownFile,
  renderMarkdown,
} from "@/lib/content-utils";

export type ArticleMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  type: string;
  excerpt: string;
  tags: string[];
  keywords: string[];
  image?: string;
  audio?: string;
  summary?: string;
};

export type Article = ArticleMeta & {
  contentHtml: string;
};

const articlesDirectory = path.join(process.cwd(), "content/articles");

type ArticleMetaWithSort = ArticleMeta & {
  sortDate: Date;
};

const TYPE_LABELS: Record<string, string> = {
  article: "கட்டுரை",
  sermon: "பிரசங்கம்",
  devotional: "தியானம்",
  study: "ஆய்வு",
  testimony: "சாட்சியம்",
};

function normalizeType(value: unknown) {
  if (typeof value !== "string") {
    return "கட்டுரை";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "கட்டுரை";
  }

  const mapped = TYPE_LABELS[trimmed.toLowerCase()];
  return mapped || trimmed;
}

function readArticleMeta(fileName: string): ArticleMetaWithSort {
  const slug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(articlesDirectory, fileName);
  const { data, content, stats } = parseMarkdownFile(fullPath);
  const typeLabel = normalizeType(data.type);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const summary = typeof data.summary === "string" ? data.summary : "";
  const tags = normalizeStringList(data.tags);
  const keywords = normalizeStringList(data.keywords);
  const audio = getAudioPath(data.audio);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof data.author === "string" ? data.author : "",
    type: typeLabel,
    excerpt: summary || getExcerpt(content),
    tags,
    keywords,
    image: image || undefined,
    audio: audio || undefined,
    summary: summary || undefined,
    sortDate: parsedDate,
  };
}

export function getAllArticles(): ArticleMeta[] {
  const fileNames = listMarkdownFiles(articlesDirectory);
  const articles = fileNames.map((fileName) => readArticleMeta(fileName));

  return articles
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      date: article.date,
      author: article.author,
      type: article.type,
      excerpt: article.excerpt,
      tags: article.tags,
      keywords: article.keywords,
      image: article.image,
      audio: article.audio,
      summary: article.summary,
    }));
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);
  const { data, content, stats } = parseMarkdownFile(fullPath);
  const typeLabel = normalizeType(data.type);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const summary = typeof data.summary === "string" ? data.summary : "";
  const tags = normalizeStringList(data.tags);
  const keywords = normalizeStringList(data.keywords);
  const audio = getAudioPath(data.audio);
  const contentHtml = await renderMarkdown(content);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof data.author === "string" ? data.author : "",
    type: typeLabel,
    excerpt: summary || getExcerpt(content),
    tags,
    keywords,
    image: image || undefined,
    audio: audio || undefined,
    summary: summary || undefined,
    contentHtml,
  };
}
