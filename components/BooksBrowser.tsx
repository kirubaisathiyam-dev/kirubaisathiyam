"use client";

import type { BookMeta } from "@/lib/books";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  books: BookMeta[];
};

function normalizeText(value: string) {
  return value.toLowerCase();
}

export default function BooksBrowser({ books }: Props) {
  const [searchText, setSearchText] = useState("");

  const filteredBooks = useMemo(() => {
    const query = normalizeText(searchText.trim());

    if (!query) {
      return books;
    }

    return books.filter((book) =>
      normalizeText(
        [book.title, book.author, book.summary, ...book.keywords]
          .filter(Boolean)
          .join(" "),
      ).includes(query),
    );
  }, [books, searchText]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="book-search">
          தேடல்
        </label>
        <input
          id="book-search"
          type="search"
          placeholder="தலைப்பு, ஆசிரியர், அல்லது முக்கியச் சொல்லால் தேடவும்"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="w-full border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <p style={{ color: "var(--muted-foreground)" }}>
          {filteredBooks.length} புத்தக
          {filteredBooks.length === 1 ? "ம்" : "ங்கள்"}
        </p>
      </div>

      {filteredBooks.length === 0 ? (
        <div
          className="border p-6 text-center text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          எந்தப் புத்தகமும் கிடைக்கவில்லை. வேறு தேடல் சொல்லை முயற்சிக்கவும்.
        </div>
      ) : (
        <ul className="space-y-6">
          {filteredBooks.map((book) => (
            <li key={book.slug}>
              <Link
                href={`/books/${book.slug}`}
                className="block border"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start">
                  {book.image ? (
                    <div
                      className="flex-shrink-0 self-start overflow-hidden border w-full sm:w-56"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <div className="relative aspect-[3/4] w-full">
                        <Image
                          src={book.image}
                          alt={book.title}
                          fill
                          sizes="(min-width: 640px) 14rem, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-3 p-4 sm:p-5">
                    <h2 className="text-lg font-semibold leading-snug">
                      {book.title}
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {book.author}
                    </p>
                    <p className="text-sm leading-relaxed">{book.summary}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
