import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PrecachePayload = {
  articles: string[];
  bibleBooks: string[];
};

function listFiles(dir: string, ext: string) {
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => file.toLowerCase().endsWith(ext))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export async function GET() {
  const articlesDir = path.join(process.cwd(), "content", "articles");
  const booksDir = path.join(process.cwd(), "public", "local-bible", "books");

  const articleFiles = listFiles(articlesDir, ".md");
  const bookFiles = listFiles(booksDir, ".json");

  const payload: PrecachePayload = {
    articles: articleFiles.map(
      (file) => `/articles/${file.replace(/\.md$/i, "")}`,
    ),
    bibleBooks: bookFiles.map((file) => `/local-bible/books/${file}`),
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
