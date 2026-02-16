import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const articlesDir = path.join(projectRoot, "content", "articles");
const booksDir = path.join(projectRoot, "public", "local-bible", "books");
const outputPath = path.join(projectRoot, "public", "pwa-precache.json");

const listFiles = (dir, ext) => {
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => file.toLowerCase().endsWith(ext))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
};

const articleFiles = listFiles(articlesDir, ".md");
const bookFiles = listFiles(booksDir, ".json");

const payload = {
  articles: articleFiles.map((file) => `/articles/${file.replace(/\.md$/i, "")}`),
  bibleBooks: bookFiles.map((file) => `/local-bible/books/${file}`),
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`PWA precache manifest written: ${outputPath}`);
