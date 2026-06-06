"use client";

import type { BookMeta } from "@/lib/books";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

type Props = {
  books: BookMeta[];
};

function BookCard({
  book,
  showBorder = true,
}: {
  book: BookMeta;
  showBorder?: boolean;
}) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className={`flex h-full flex-col ${showBorder ? "border" : ""}`}
      style={
        showBorder
          ? {
              borderColor: "var(--border-color)",
              backgroundColor: "var(--muted-background)",
            }
          : { backgroundColor: "var(--muted-background)" }
      }
    >
      {book.image ? (
        <div
          className={`overflow-hidden ${showBorder ? "border" : ""}`}
          style={
            showBorder ? { borderColor: "var(--border-color)" } : undefined
          }
        >
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={book.image}
              alt={book.title}
              fill
              sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 70vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}
      <div className="space-y-2 p-4">
        <div className="text-lg font-semibold leading-snug hover:underline">
          {book.title}
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {book.author}
        </p>
      </div>
    </Link>
  );
}

export default function RecentBooksCarousel({ books }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    slidesToScroll: 1,
  });

  useEffect(() => {
    void emblaApi;
  }, [emblaApi]);

  return (
    <>
      <div className="space-y-4 sm:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex touch-pan-y">
            {books.map((book) => (
              <div
                key={book.slug}
                className="min-w-0 flex-[0_0_90vw] pl-4"
                style={{ maxWidth: "20rem" }}
              >
                <BookCard book={book} showBorder={true} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <BookCard key={book.slug} book={book} />
        ))}
      </div>
    </>
  );
}
