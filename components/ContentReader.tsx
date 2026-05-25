"use client";

import type { ReactNode } from "react";
import Comments from "@/components/Comments";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/Icons";
import LikeButton from "@/components/LikeButton";
import ReaderSettingsButton, {
  useReaderFontSize,
  useReaderTemperature,
} from "@/components/ReaderSettingsButton";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import ShareButton from "@/components/ShareButton";
import { formatTamilDate } from "@/lib/date";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

type ContentNavigationItem = {
  href: string;
  label: string;
  title: string;
};

type ContentNavigationLink = {
  href: string;
  label: string;
};

type ContentReaderProps = {
  itemId: string;
  title: string;
  author: string;
  date: string;
  eyebrow?: string;
  image?: string;
  audio?: string;
  contentHtml: string;
  shareTitle: string;
  shareText: string;
  shareUrl: string;
  jsonLd?: Record<string, unknown>;
  footerNote?: ReactNode;
  showDate?: boolean;
  showEngagement?: boolean;
  navigation?: {
    previous?: ContentNavigationItem;
    next?: ContentNavigationItem;
    toc?: ContentNavigationLink;
  };
};

export default function ContentReader({
  itemId,
  title,
  author,
  date,
  eyebrow,
  image,
  audio,
  contentHtml,
  shareTitle,
  shareText,
  shareUrl,
  jsonLd,
  footerNote,
  showDate = true,
  showEngagement = true,
  navigation,
}: ContentReaderProps) {
  const { fontSize, setFontSize } = useReaderFontSize();
  const { temperature, setTemperature } = useReaderTemperature();
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!topRef.current || typeof window === "undefined") return;
    const top =
      topRef.current.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }, [itemId]);

  return (
    <article className="space-y-6">
      <div ref={topRef} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <header className="space-y-3 text-center mb-12">
        {eyebrow && (
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{
              color: "var(--muted-foreground)",
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="font-semibold leading-tight"
          style={{
            fontSize: "calc(clamp(1rem, 1.2rem + 1.6vw, 2.2rem))",
          }}
        >
          {title}
        </h1>
        <p
          className="text-sm"
          style={{
            color: "var(--muted-foreground)",
          }}
        >
          {author}

          {showDate && (
            <span
              className="text-sm"
              style={{
                color: "var(--muted-foreground)",
              }}
            >
              <span className="px-2">·</span>
              {formatTamilDate(date)}
            </span>
          )}
        </p>
      </header>

      {audio && (
        <div
          className="mx-auto max-w-5xl py-8 md:px-5"
          style={{ borderColor: "var(--border-color)" }}
        >
          <audio className="w-full" controls src={audio} preload="metadata">
            Your browser does not support audio playback. Download the file{" "}
            <a
              href={audio}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              here
            </a>
            .
          </audio>
        </div>
      )}

      {image && (
        <div
          className="overflow-hidden border"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 48rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div
        className="prose prose-neutral mx-auto max-w-3xl"
        style={{ fontSize: "calc(1em * var(--reader-font-scale, 1))" }}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {footerNote && (
        <div
          className="mx-auto max-w-3xl border-t pt-5 text-sm leading-7"
          style={{
            color: "var(--muted-foreground)",
            borderColor: "var(--border-color)",
          }}
        >
          {footerNote}
        </div>
      )}

      {(navigation?.previous || navigation?.next || navigation?.toc) && (
        <nav
          aria-label="உள்ளடக்க வழிசெலுத்தல்"
          className="mx-auto mt-12 flex max-w-3xl items-center justify-between gap-3 border-t pt-6"
          style={{ borderColor: "var(--border-color)" }}
        >
          {navigation.previous ? (
            <Link
              href={navigation.previous.href}
              scroll={false}
              className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
              style={{ borderColor: "var(--border-color)" }}
            >
              <ArrowLeftIcon style={{ width: 15, height: 15 }} />
              <span className="hidden md:inline">முந்தையது</span>
            </Link>
          ) : (
            <span
              className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-semibold opacity-50"
              style={{ borderColor: "var(--border-color)" }}
              aria-disabled="true"
            >
              <ArrowLeftIcon style={{ width: 15, height: 15 }} />
              <span className="hidden md:inline">முந்தையது</span>
            </span>
          )}

          {navigation.toc ? (
            <Link
              href={navigation.toc.href}
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--muted-foreground)" }}
            >
              {navigation.toc.label}
            </Link>
          ) : (
            <div aria-hidden="true" />
          )}

          {navigation.next ? (
            <Link
              href={navigation.next.href}
              scroll={false}
              className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span className="hidden md:inline">அடுத்தது</span>
              <ArrowRightIcon style={{ width: 15, height: 15 }} />
            </Link>
          ) : (
            <span
              className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-semibold opacity-50"
              style={{ borderColor: "var(--border-color)" }}
              aria-disabled="true"
            >
              <span className="hidden md:inline">அடுத்தது</span>
              <ArrowRightIcon style={{ width: 15, height: 15 }} />
            </span>
          )}
        </nav>
      )}

      {showEngagement && (
        <div className="mx-auto flex max-w-3xl justify-end">
          <LikeButton articleId={itemId} />
        </div>
      )}

      {showEngagement && <Comments articleId={itemId} />}

      <div className="sticky bottom-6 z-40 flex justify-end">
        <div className="flex flex-col items-end gap-3">
          <ReaderSettingsButton
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            temperature={temperature}
            onTemperatureChange={setTemperature}
          />
          <ShareButton
            title={shareTitle}
            text={shareText}
            url={shareUrl}
            className="shadow-sm"
          />
          <ScrollToTopButton />
        </div>
      </div>
    </article>
  );
}
