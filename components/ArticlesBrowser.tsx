"use client";

import type { ArticleMeta } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  articles: ArticleMeta[];
};

const PAGE_SIZE = 10;

function normalizeText(value: string) {
  return value.toLowerCase();
}

export default function ArticlesBrowser({ articles }: Props) {
  const [searchText, setSearchText] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [page, setPage] = useState(1);

  const typeOptions = useMemo(() => {
    const typeMap = new Map<string, { label: string; count: number }>();

    for (const article of articles) {
      const raw = article.type?.trim();
      if (!raw) {
        continue;
      }
      const key = normalizeText(raw);
      const existing = typeMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        typeMap.set(key, { label: raw, count: 1 });
      }
    }

    return Array.from(typeMap.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        count: value.count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [articles]);

  const tagOptions = useMemo(() => {
    const tagMap = new Map<string, { label: string; count: number }>();

    for (const article of articles) {
      for (const tag of article.tags ?? []) {
        const cleaned = tag.trim();
        if (!cleaned) {
          continue;
        }
        const key = normalizeText(cleaned);
        const existing = tagMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          tagMap.set(key, { label: cleaned, count: 1 });
        }
      }
    }

    return Array.from(tagMap.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        count: value.count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const query = normalizeText(searchText.trim());

    return articles.filter((article) => {
      const typeMatch =
        activeType === "all" ||
        normalizeText(article.type || "") === activeType;
      if (!typeMatch) {
        return false;
      }

      const tagMatch =
        activeTag === "all" ||
        article.tags.some((tag) => normalizeText(tag) === activeTag);
      if (!tagMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        article.title,
        article.excerpt,
        article.author,
        article.type,
        ...(article.tags ?? []),
        ...(article.keywords ?? []),
      ]
        .filter(Boolean)
        .join(" ");

      return normalizeText(haystack).includes(query);
    });
  }, [articles, activeTag, activeType, searchText]);

  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const paginatedArticles =
    totalPages === 0
      ? []
      : filteredArticles.slice(
          (currentPage - 1) * PAGE_SIZE,
          currentPage * PAGE_SIZE,
        );

  const showReset =
    searchText.trim().length > 0 || activeTag !== "all" || activeType !== "all";

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-semibold" htmlFor="article-search">
              Search
            </label>
            <input
              id="article-search"
              type="search"
              placeholder="Search by title, type, tag, or keyword"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setPage(1);
              }}
              className="w-full border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--border-color)" }}
            />
          </div>
        </div>
        <div
          className="flex flex-nowrap gap-4 border-b mt-6"
          style={{ borderColor: "var(--border-color)", overflowX: "auto" }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveType("all");
              setPage(1);
            }}
            className="shrink-0 cursor-pointer px-1 pb-2 text-sm font-semibold transition border-b-2"
            style={{
              borderColor:
                activeType === "all" ? "var(--foreground)" : "transparent",
              color:
                activeType === "all"
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
            }}
            aria-pressed={activeType === "all"}
          >
            அனைத்தும்
          </button>
          {typeOptions.map((type) => {
            const isActive = activeType === type.key;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => {
                  setActiveType(type.key);
                  setPage(1);
                }}
                className="shrink-0 cursor-pointer px-1 pb-2 text-sm font-semibold transition border-b-2"
                style={{
                  borderColor: isActive
                    ? "var(--foreground)"
                    : "transparent",
                  color: isActive
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                }}
                aria-pressed={isActive}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-nowrap gap-2" style={{ overflowX: "auto" }}>
          <button
            type="button"
            onClick={() => {
              setActiveTag("all");
              setPage(1);
            }}
            className="shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs transition"
            style={{
              borderColor:
                activeTag === "all"
                  ? "var(--foreground)"
                  : "var(--border-color)",
              background:
                activeTag === "all" ? "var(--foreground)" : "transparent",
              color: activeTag === "all" ? "var(--background)" : "inherit",
            }}
            aria-pressed={activeTag === "all"}
          >
            அனைத்தும்
          </button>
          {tagOptions.map((tag) => {
            const isActive = activeTag === tag.key;
            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => {
                  setActiveTag(tag.key);
                  setPage(1);
                }}
                className="shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs transition"
                style={{
                  borderColor: isActive
                    ? "var(--foreground)"
                    : "var(--border-color)",
                  background: isActive ? "var(--foreground)" : "transparent",
                  color: isActive ? "var(--background)" : "inherit",
                }}
                aria-pressed={isActive}
              >
                {tag.label}
              </button>
            );
          })}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p style={{ color: "var(--muted-foreground)" }}>
          {filteredArticles.length} result
          {filteredArticles.length === 1 ? "" : "s"}
        </p>
        {totalPages > 1 && (
          <p style={{ color: "var(--muted-foreground)" }}>
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {paginatedArticles.length === 0 ? (
        <div className="border p-6 text-center text-sm">
          No articles found. Try another search or tag.
        </div>
      ) : (
        <ul className="space-y-6">
          {paginatedArticles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/articles/${article.slug}`}
                className="block border"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start">
                  {article.image && (
                    <div
                      className="flex-shrink-0 self-start overflow-hidden border w-full sm:w-72"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          sizes="(min-width: 640px) 18rem, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 p-4 sm:p-5">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {article.type || "கட்டுரை"}
                    </p>
                    <h2 className="text-lg font-semibold leading-snug">
                      {article.title}
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {formatTamilDate(article.date)} · {article.author}
                    </p>
                    {article.excerpt && (
                      <p className="text-sm leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              setPage((prev) => Math.max(1, Math.min(totalPages, prev - 1)))
            }
            disabled={currentPage === 1}
            className="cursor-pointer border px-3 py-1 text-sm disabled:cursor-not-allowed"
            style={{
              borderColor: "var(--border-color)",
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => {
              const isActive = pageNumber === currentPage;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className="cursor-pointer border px-3 py-1 text-sm"
                  style={{
                    borderColor: isActive
                      ? "var(--foreground)"
                      : "var(--border-color)",
                    background: isActive
                      ? "var(--foreground)"
                      : "transparent",
                    color: isActive ? "var(--background)" : "inherit",
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              );
            },
          )}
          <button
            type="button"
            onClick={() =>
              setPage((prev) => Math.max(1, Math.min(totalPages, prev + 1)))
            }
            disabled={currentPage === totalPages}
            className="cursor-pointer border px-3 py-1 text-sm disabled:cursor-not-allowed"
            style={{
              borderColor: "var(--border-color)",
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
