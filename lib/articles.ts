import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export type ArticleMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
};

export type Article = ArticleMeta & {
  contentHtml: string;
};

const articlesDirectory = path.join(process.cwd(), "content/articles");

function readArticleMeta(fileName: string): ArticleMeta {
  const slug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(articlesDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(fileContents);
  const { title, date, author } = data as {
    title?: unknown;
    date?: unknown;
    author?: unknown;
  };

  return {
    slug,
    title: typeof title === "string" ? title : "",
    date:
      typeof date === "string"
        ? date
        : date instanceof Date
          ? date.toISOString().slice(0, 10)
          : "",
    author: typeof author === "string" ? author : "",
  };
}

export function getAllArticles(): ArticleMeta[] {
  const fileNames = fs
    .readdirSync(articlesDirectory)
    .filter((fileName) => fileName.endsWith(".md"));

  return fileNames.map((fileName) => readArticleMeta(fileName));
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const { data, content } = matter(fileContents);
  const { title, date, author } = data as {
    title?: unknown;
    date?: unknown;
    author?: unknown;
  };

  const processedContent = await remark().use(html).process(content);

  return {
    slug,
    title: typeof title === "string" ? title : "",
    date:
      typeof date === "string"
        ? date
        : date instanceof Date
          ? date.toISOString().slice(0, 10)
          : "",
    author: typeof author === "string" ? author : "",
    contentHtml: processedContent.toString(),
  };
}
