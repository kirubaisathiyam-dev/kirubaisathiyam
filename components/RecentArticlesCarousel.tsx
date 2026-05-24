"use client";

import { ArrowLeftIcon, ArrowRightIcon, VolumeIcon } from "@/components/Icons";
import type { ArticleMeta } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  articles: ArticleMeta[];
};

function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="flex h-full flex-col border"
      style={{ borderColor: "var(--border-color)" }}
    >
      {article.image && (
        <div
          className="overflow-hidden border"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 70vw"
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-1">
          {article.audio && (
            <span
              className="text-[0.8rem] opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              <VolumeIcon style={{ width: 15, height: 15 }} />
            </span>
          )}
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--muted-foreground)" }}
          >
            {article.type || "à®•à®Ÿà¯à®Ÿà¯à®°à¯ˆ"}
          </p>
        </div>
        <div className="text-lg font-semibold leading-snug hover:underline">
          {article.title}
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {formatTamilDate(article.date)} · {article.author}
        </p>
      </div>
    </Link>
  );
}

export default function RecentArticlesCarousel({ articles }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    slidesToScroll: 1,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(articles.length > 1);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const updateButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    const frame = window.requestAnimationFrame(updateButtons);
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    return () => {
      window.cancelAnimationFrame(frame);
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <>
      <div className="space-y-4 sm:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex touch-pan-y">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="min-w-0 flex-[0_0_80vw] pl-4"
                style={{ maxWidth: "20rem" }}
              >
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--muted-background)",
              color: "var(--foreground)",
            }}
            aria-label="Previous articles"
          >
            <ArrowLeftIcon style={{ width: 18, height: 18 }} />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--muted-background)",
              color: "var(--foreground)",
            }}
            aria-label="Next articles"
          >
            <ArrowRightIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </>
  );
}
