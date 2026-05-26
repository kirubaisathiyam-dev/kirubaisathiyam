import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const articlesDir = path.join(projectRoot, "content", "articles");
const churchHistoryDir = path.join(projectRoot, "content", "church-history");
const theologyDir = path.join(projectRoot, "content", "theology");
const booksDir = path.join(projectRoot, "public", "local-bible", "books");
const uploadsDir = path.join(projectRoot, "public", "uploads");
const imagesDir = path.join(projectRoot, "public", "images");
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

const listDirectories = (dir) => {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
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

const listPublicAssets = (dir, urlPrefix, baseDir = dir) => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listPublicAssets(fullPath, urlPrefix, baseDir);
      }

      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      return [`${urlPrefix}/${relativePath}`];
    });
  } catch {
    return [];
  }
};

const articleFiles = listFiles(articlesDir, ".md");
const churchHistoryFiles = listRecursiveFiles(churchHistoryDir, ".md").sort((a, b) =>
  a.localeCompare(b),
);
const churchHistorySections = listDirectories(churchHistoryDir);
const theologySections = listDirectories(theologyDir);
const theologyFiles = listRecursiveFiles(theologyDir, ".md").sort((a, b) =>
  a.localeCompare(b),
);
const bookFiles = listFiles(booksDir, ".json");

const routeSet = new Set([
  "/",
  "/articles",
  "/church-history",
  "/theology",
  "/bible",
  "/bible/read",
  "/bible/search",
  "/privacy-terms",
]);

for (const file of articleFiles) {
  routeSet.add(`/articles/${file.replace(/\.md$/i, "")}`);
}

for (const section of churchHistorySections) {
  routeSet.add(`/church-history/${section}`);
}

for (const file of churchHistoryFiles) {
  const normalized = file.replace(/\\/g, "/").replace(/\.md$/i, "");
  const parts = normalized.split("/").filter(Boolean);

  if (parts.length < 2) {
    continue;
  }

  const [subsection, maybeGroup, maybeSlug] = parts;
  routeSet.add(`/church-history/${subsection}`);

  if (parts.length === 2) {
    routeSet.add(`/church-history/${subsection}/${maybeGroup}`);
    continue;
  }

  routeSet.add(`/church-history/${subsection}/${maybeGroup}/${maybeSlug}`);
}

for (const section of theologySections) {
  routeSet.add(`/theology/${section}`);
}

for (const file of theologyFiles) {
  const normalized = file.replace(/\\/g, "/").replace(/\.md$/i, "");
  const parts = normalized.split("/").filter(Boolean);

  if (parts.length < 2) {
    continue;
  }
  const [section, maybeSubsection, maybeSlug] = parts;

  if (parts.length === 2) {
    const slug = maybeSubsection;
    routeSet.add(`/theology/${section}/general/${slug}`);
    routeSet.add(`/theology/${section}/general`);
    continue;
  }

  const subsection = maybeSubsection;
  const slug = maybeSlug;
  routeSet.add(`/theology/${section}/${subsection}`);
  routeSet.add(`/theology/${section}/${subsection}/${slug}`);
}

const contentAssets = [
  "/daily-devotion.json",
  "/bible-notes.json",
  "/local-bible/Books.json",
  ...listPublicAssets(uploadsDir, "/uploads"),
  ...listPublicAssets(imagesDir, "/images"),
].sort((a, b) => a.localeCompare(b));

const payload = {
  routes: Array.from(routeSet).sort((a, b) => a.localeCompare(b)),
  articles: articleFiles.map((file) => `/articles/${file.replace(/\.md$/i, "")}`),
  churchHistoryTopics: churchHistoryFiles.map((file) => {
    const normalized = file.replace(/\\/g, "/").replace(/\.md$/i, "");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length === 2) {
      return `/church-history/${parts[0]}/${parts[1]}`;
    }
    return `/church-history/${parts[0]}/${parts[1]}/${parts[2]}`;
  }),
  theologyTopics: theologyFiles.map((file) => {
    const normalized = file.replace(/\\/g, "/").replace(/\.md$/i, "");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length === 2) {
      return `/theology/${parts[0]}/general/${parts[1]}`;
    }
    return `/theology/${normalized}`;
  }),
  bibleBooks: bookFiles.map((file) => `/local-bible/books/${file}`),
  contentAssets,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`PWA precache manifest written: ${outputPath}`);
