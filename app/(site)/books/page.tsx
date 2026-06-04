import type { Metadata } from "next";
import BooksBrowser from "@/components/BooksBrowser";
import { BOOKS_SECTION, getAllBooks } from "@/lib/books";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl(
  BOOKS_SECTION.image || "/web-app-manifest-512x512.png",
);

export const metadata: Metadata = {
  title: "புத்தகங்கள் | தமிழ் கிறிஸ்தவ புத்தகங்கள்",
  description: BOOKS_SECTION.description,
  keywords: [
    "தமிழ் கிறிஸ்தவ புத்தகங்கள்",
    "தமிழில் கிறிஸ்தவ புத்தகங்கள்",
    "தமிழ் இறையியல் புத்தகங்கள்",
    "கிருபை சத்தியம் புத்தகங்கள்",
  ],
  alternates: {
    canonical: "/books",
  },
  openGraph: {
    type: "website",
    url: "/books",
    title: "புத்தகங்கள் | தமிழ் கிறிஸ்தவ புத்தகங்கள்",
    description: BOOKS_SECTION.description,
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "புத்தகங்கள் | தமிழ் கிறிஸ்தவ புத்தகங்கள்",
    description: BOOKS_SECTION.description,
    images: [shareImage],
  },
};

export default function BooksPage() {
  const books = getAllBooks();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          புத்தகங்கள்
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          {BOOKS_SECTION.description}
        </p>
      </header>

      <BooksBrowser books={books} />
    </div>
  );
}
