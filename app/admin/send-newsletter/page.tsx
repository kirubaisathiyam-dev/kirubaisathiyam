import fs from "fs";
import path from "path";
import matter from "gray-matter";
import SendNewsletterForm, {
  type NewsletterArticle,
} from "./send-newsletter-form";

type ArticleRecord = NewsletterArticle & {
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

function loadArticles(): NewsletterArticle[] {
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

    return {
      slug,
      title: typeof data?.title === "string" ? data.title : slug,
      date: dateLabel,
      content,
      sortDate: parsedDate,
    };
  });

  return records
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .map(({ sortDate, ...article }) => article);
}

export default function SendNewsletterPage() {
  const articles = loadArticles();

  return (
    <main style={{ padding: "2rem", maxWidth: "680px" }}>
      <h1>Send Newsletter</h1>
      <p style={{ marginTop: "0.5rem", color: "#555" }}>
        Select an article and send it as a newsletter.
      </p>

      <SendNewsletterForm articles={articles} />
    </main>
  );
}
