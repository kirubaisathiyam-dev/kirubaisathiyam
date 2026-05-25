"use client";

import { VolumeIcon } from "@/components/Icons";
import type { ArticleMeta } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

type Props = {
  articles: ArticleMeta[];
};

function ArticleCard({
  article,
  showBorder = true,
}: {
  article: ArticleMeta;
  showBorder?: boolean;
}) {
  return (
    <Link
      href={`/articles/${article.slug}`}
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
      {article.image && (
        <div
          className={`overflow-hidden ${showBorder ? "border" : ""}`}
          style={
            showBorder ? { borderColor: "var(--border-color)" } : undefined
          }
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

  useEffect(() => {
    void emblaApi;
  }, [emblaApi]);

  return (
    <>
      <div className="space-y-4 sm:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex touch-pan-y">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="min-w-0 flex-[0_0_90vw] pl-4"
                style={{ maxWidth: "20rem" }}
              >
                <ArticleCard article={article} showBorder={true} />
              </div>
            ))}
          </div>
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
