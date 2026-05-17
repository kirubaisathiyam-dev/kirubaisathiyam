"use client";

import { SearchIcon } from "@/components/Icons";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type BibleSearchFormProps = {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export default function BibleSearchForm({
  initialQuery = "",
  placeholder = "வேதாகமத்தில் தேடுங்கள்",
  className,
  autoFocus = false,
}: BibleSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmedQuery = query.trim();
        startTransition(() => {
          router.push(
            trimmedQuery
              ? `/bible/search?q=${encodeURIComponent(trimmedQuery)}`
              : "/bible/search",
          );
        });
      }}
      className={`flex items-center gap-2 border px-3 py-3 shadow-sm ${className ?? ""}`}
      style={{
        borderColor: "var(--border-color)",
        background: "var(--background)",
      }}
      role="search"
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none sm:text-base"
        style={{ color: "var(--foreground)" }}
        aria-label="Search Bible"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex h-10 w-10 items-center justify-center transition hover:opacity-85 disabled:opacity-60"
        style={{ color: "var(--foreground)" }}
        aria-label="Search Bible"
      >
        <SearchIcon
          style={{
            width: 20,
            height: 20,
            transform: "scaleX(-1)",
          }}
        />
      </button>
    </form>
  );
}
