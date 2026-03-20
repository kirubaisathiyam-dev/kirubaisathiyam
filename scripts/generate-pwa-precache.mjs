import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const articlesDir = path.join(projectRoot, "content", "articles");
const theologyDir = path.join(projectRoot, "content", "theology");
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

const listRecursiveFiles = (dir, ext, baseDir = dir) => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listRecursiveFiles(fullPath, ext, baseDir);
      }

      if (!entry.name.toLowerCase().endsWith(ext)) {
        return [];
      }

      return [path.relative(baseDir, fullPath)];
    });
  } catch {
    return [];
  }
};

const articleFiles = listFiles(articlesDir, ".md");
const theologyFiles = listRecursiveFiles(theologyDir, ".md").sort((a, b) =>
  a.localeCompare(b),
);
const bookFiles = listFiles(booksDir, ".json");

const payload = {
  articles: articleFiles.map((file) => `/articles/${file.replace(/\.md$/i, "")}`),
  theologyTopics: theologyFiles.map((file) => {
    const normalized = file.replace(/\\/g, "/").replace(/\.md$/i, "");
    return `/theology/${normalized}`;
  }),
  bibleBooks: bookFiles.map((file) => `/local-bible/books/${file}`),
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`PWA precache manifest written: ${outputPath}`);
