import Comments from "@/components/Comments";
import LikeButton from "@/components/LikeButton";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import ShareButton from "@/components/ShareButton";
import { formatTamilDate } from "@/lib/date";
import Image from "next/image";

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
}: ContentReaderProps) {
  return (
    <article className="space-y-6">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <header className="space-y-3 text-center">
        {eyebrow && (
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--muted-foreground)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
          {author}
        </p>
        <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
          {formatTamilDate(date)}
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
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      <div className="mx-auto flex max-w-3xl justify-end">
        <LikeButton articleId={itemId} />
      </div>

      <Comments articleId={itemId} />

      <div className="sticky bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <div className="flex flex-col gap-3">
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
