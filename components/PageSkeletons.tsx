import type { ReactNode } from "react";
import { SkeletonBlock, SkeletonCircle, SkeletonText } from "@/components/Skeleton";

function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--muted-background)",
      }}
    >
      {children}
    </div>
  );
}

export function HeroOverlaySkeleton() {
  return (
    <section
      className="relative -mt-8 overflow-hidden sm:-mt-10"
      style={{ borderColor: "var(--border-color)" }}
      aria-hidden="true"
    >
      <div className="relative min-h-[24rem] bg-[#111111] sm:min-h-[30rem] lg:min-h-[36rem]">
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 flex min-h-[24rem] items-center px-5 py-10 sm:min-h-[30rem] sm:px-8 lg:min-h-[36rem] lg:px-10">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            <SkeletonText className="h-3 w-32" tone="contrast" />
            <div className="space-y-3">
              <SkeletonText className="h-9 w-full max-w-2xl" tone="contrast" />
              <SkeletonText className="h-9 w-4/5 max-w-xl" tone="contrast" />
            </div>
            <div className="space-y-3 max-w-3xl">
              <SkeletonText className="h-4 w-full" tone="contrast" />
              <SkeletonText className="h-4 w-11/12" tone="contrast" />
              <SkeletonText className="h-4 w-3/4" tone="contrast" />
            </div>
            <SkeletonBlock
              className="mt-3 h-11 w-36"
              tone="contrast"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSplitSkeleton() {
  return (
    <Surface className="grid overflow-hidden border sm:grid-cols-[0.7fr_1.1fr] md:grid-cols-[0.4fr_1.1fr]">
      <SkeletonBlock className="aspect-square border-b md:border-b-0 md:border-r" />
      <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
        <div className="space-y-3">
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-11/12" />
          <SkeletonText className="h-4 w-2/3" />
        </div>
        <SkeletonText className="h-5 w-40" />
      </div>
    </Surface>
  );
}

export function ArticleCardSkeleton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Surface className="flex h-full flex-col border">
      <SkeletonBlock className={compact ? "aspect-[16/9]" : "aspect-[4/3]"} />
      <div className="space-y-3 p-4 sm:p-5">
        <SkeletonText className="h-3 w-24" />
        <div className="space-y-2">
          <SkeletonText className="h-6 w-full" />
          <SkeletonText className="h-6 w-4/5" />
        </div>
        <SkeletonText className="h-3 w-40" />
        {!compact ? (
          <div className="space-y-2 pt-1">
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-10/12" />
          </div>
        ) : null}
      </div>
    </Surface>
  );
}

export function TheologyCardSkeleton() {
  return (
    <Surface className="flex h-full flex-col border">
      <SkeletonBlock className="aspect-square border-b" />
      <div className="space-y-3 p-5">
        <SkeletonText className="h-7 w-2/3" />
        <div className="space-y-2">
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-11/12" />
          <SkeletonText className="h-4 w-2/3" />
        </div>
      </div>
    </Surface>
  );
}

function SectionHeadingSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <SkeletonText className="h-7 w-36" />
      <SkeletonText className="h-4 w-16" />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-16">
      <HeroOverlaySkeleton />

      <section className="mx-auto w-full max-w-5xl px-4">
        <FeatureSplitSkeleton />
      </section>

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <SectionHeadingSkeleton />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <ArticleCardSkeleton key={index} compact />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <SectionHeadingSkeleton />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <TheologyCardSkeleton key={index} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <SkeletonText className="h-7 w-48" />
        <FeatureSplitSkeleton />
      </section>
    </div>
  );
}

export function ArticleIndexSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3">
        <SkeletonText className="h-9 w-48" />
        <SkeletonText className="h-4 w-72 max-w-full" />
      </div>

      <section className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <SkeletonText className="h-4 w-20" />
            <SkeletonBlock className="h-11 w-full rounded-none border" />
          </div>
          <div className="flex gap-3 border-b pb-2">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonText key={index} className="h-4 w-16" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBlock
                key={index}
                className="h-8 w-20 border"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function CatalogGridSkeleton({
  titleWidth = "w-40",
  cardCount = 4,
}: {
  titleWidth?: string;
  cardCount?: number;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3">
        <SkeletonText className={`h-9 ${titleWidth}`} />
        <div className="space-y-2">
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-5/6" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: cardCount }, (_, index) => (
          <TheologyCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function OutlinePageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-3">
        <SkeletonBlock className="h-[min(100vw,500px)] w-full border sm:h-[480px]" />
        <div className="space-y-3">
          <SkeletonText className="h-9 w-56" />
          <div className="space-y-2">
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-11/12" />
            <SkeletonText className="h-4 w-3/4" />
          </div>
          <div className="space-y-2 max-w-3xl">
            <SkeletonText className="h-3.5 w-full" />
            <SkeletonText className="h-3.5 w-10/12" />
          </div>
        </div>
      </header>

      <div className="space-y-10">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-4 pl-4">
            <div className="flex items-baseline gap-3">
              <SkeletonText className="h-6 w-6" />
              <SkeletonText className="h-7 w-56" />
            </div>
            <div className="space-y-3 pl-8">
              {Array.from({ length: 4 }, (_, itemIndex) => (
                <div key={itemIndex} className="flex items-baseline gap-3">
                  <SkeletonText className="h-4 w-12" />
                  <SkeletonText className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContentReaderSkeleton({
  showImage = true,
  showAudio = false,
  showComments = true,
}: {
  showImage?: boolean;
  showAudio?: boolean;
  showComments?: boolean;
}) {
  return (
    <article className="space-y-6">
      <header className="mb-12 space-y-3 text-center">
        <SkeletonText className="mx-auto h-3 w-24" />
        <div className="space-y-3">
          <SkeletonText className="mx-auto h-10 w-full max-w-2xl" />
          <SkeletonText className="mx-auto h-10 w-3/4 max-w-xl" />
        </div>
        <SkeletonText className="mx-auto h-4 w-48" />
      </header>

      {showAudio ? (
        <SkeletonBlock className="mx-auto h-14 max-w-5xl" />
      ) : null}

      {showImage ? (
        <SkeletonBlock className="aspect-[16/9] w-full border" />
      ) : null}

      <div className="mx-auto max-w-3xl space-y-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-[96%]" />
            <SkeletonText
              className={`h-4 ${index % 3 === 0 ? "w-2/3" : "w-5/6"}`}
            />
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-3xl border-t pt-6">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-10 w-24 border" />
          <SkeletonText className="h-4 w-20" />
          <SkeletonBlock className="h-10 w-24 border" />
        </div>
      </div>

      {showComments ? <CommentsSkeleton /> : null}
    </article>
  );
}

export function DevotionDetailSkeleton() {
  return (
    <article className="pb-10">
      <HeroOverlaySkeleton />
      <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-8 px-4 sm:mt-10 sm:px-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonText className="h-5 w-full" />
              <SkeletonText className="h-5 w-[95%]" />
              <SkeletonText
                className={`h-5 ${index % 2 === 0 ? "w-4/5" : "w-11/12"}`}
              />
            </div>
          ))}
        </div>
        <SkeletonText className="h-4 w-40" />
        <div className="flex gap-3">
          <SkeletonBlock className="h-11 w-11" />
          <SkeletonBlock className="h-11 w-11" />
        </div>
      </div>
    </article>
  );
}

export function BibleFrontPageSkeleton() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header className="space-y-4">
        <SkeletonText className="mx-auto mb-8 h-10 w-56" />
        <SkeletonBlock className="h-14 w-full" />
      </header>

      <div className="space-y-8">
        {Array.from({ length: 2 }, (_, groupIndex) => (
          <section key={groupIndex} className="space-y-3">
            <SkeletonText className="h-7 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, bookIndex) => (
                <Surface
                  key={bookIndex}
                  className="overflow-hidden border"
                >
                  <div className="flex items-center justify-between gap-4 p-3">
                    <SkeletonText className="h-5 w-40" />
                    <SkeletonCircle className="h-5 w-5" />
                  </div>
                </Surface>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ChapterTileGridSkeleton({
  tileCount = 10,
}: {
  tileCount?: number;
}) {
  return (
    <div
      className="grid overflow-hidden border border-b-0 border-r-0"
      style={{
        borderColor: "var(--border-color)",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 5rem), 1fr))",
      }}
    >
      {Array.from({ length: tileCount }, (_, index) => (
        <SkeletonBlock
          key={index}
          className="h-14 border-b border-r"
          style={{ borderColor: "var(--border-color)" }}
        />
      ))}
    </div>
  );
}

export function BibleContentsModalSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }, (_, groupIndex) => (
        <section key={groupIndex} className="space-y-3">
          <SkeletonText className="h-7 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, bookIndex) => (
              <Surface key={bookIndex} className="overflow-hidden border">
                <div className="flex items-center justify-between gap-4 p-3">
                  <SkeletonText className="h-5 w-40" />
                  <SkeletonBlock className="h-5 w-5" />
                </div>
              </Surface>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function BibleSearchPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-5">
        <SkeletonText className="mx-auto h-10 w-56" />
        <SkeletonBlock className="mx-auto h-16 max-w-3xl" />
      </header>

      <section className="mx-auto max-w-3xl space-y-5">
        <div className="space-y-2">
          <SkeletonText className="h-4 w-24" />
          <SkeletonText className="h-7 w-36" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Surface key={index} className="border px-5 py-5">
              <div className="space-y-3">
                <SkeletonText className="h-4 w-32" />
                <div className="space-y-2">
                  <SkeletonText className="h-5 w-full" />
                  <SkeletonText className="h-5 w-[94%]" />
                  <SkeletonText className="h-5 w-5/6" />
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </section>
    </div>
  );
}

export function BibleReaderSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-1 text-center">
        <SkeletonText className="mx-auto h-9 w-52" />
      </header>

      <div className="space-y-6">
        <div className="space-y-3">
          <SkeletonText className="h-5 w-3/4" />
          <SkeletonText className="h-5 w-full" />
          <SkeletonText className="h-5 w-11/12" />
        </div>

        <div className="space-y-5">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex gap-3">
              <SkeletonText className="h-4 w-6" />
              <div className="flex-1 space-y-2">
                <SkeletonText className="h-5 w-full" />
                <SkeletonText
                  className={`h-5 ${index % 2 === 0 ? "w-11/12" : "w-4/5"}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-3 border-t pt-6">
        <SkeletonBlock className="h-10 w-28 border" />
        <SkeletonText className="h-4 w-24" />
        <SkeletonBlock className="h-10 w-28 border" />
      </div>
    </div>
  );
}

export function CommentsSkeleton() {
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-2">
          <SkeletonText className="h-7 w-28" />
          <SkeletonText className="h-4 w-40" />
        </div>
        <SkeletonBlock className="h-10 w-44" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <Surface key={index} className="border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SkeletonCircle className="h-6 w-6" />
                <SkeletonText className="h-4 w-24" />
              </div>
              <SkeletonText className="h-3 w-28" />
            </div>
            <div className="mt-3 space-y-2">
              <SkeletonText className="h-4 w-full" />
              <SkeletonText className="h-4 w-[92%]" />
              <SkeletonText className="h-4 w-2/3" />
            </div>
          </Surface>
        ))}
      </div>
    </section>
  );
}

export function RepliesSkeleton() {
  return (
    <div
      className="mt-3 space-y-3 border-l p-4"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--muted-background)",
      }}
    >
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="space-y-2 px-3 py-2"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SkeletonCircle className="h-5 w-5" />
              <SkeletonText className="h-3 w-20" />
            </div>
            <SkeletonText className="h-3 w-20" />
          </div>
          <SkeletonText className="h-3.5 w-full" />
          <SkeletonText className="h-3.5 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function BibleTooltipSkeleton() {
  return (
    <div className="space-y-2 py-1">
      <SkeletonText className="h-3 w-20" />
      <SkeletonText className="h-3.5 w-full" />
      <SkeletonText className="h-3.5 w-[94%]" />
      <SkeletonText className="h-3.5 w-4/5" />
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-8">
      <Surface
        className="border p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--muted-background), var(--background))",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <SkeletonText className="h-3 w-28" />
            <SkeletonText className="h-9 w-40" />
            <SkeletonText className="h-4 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-24 border self-start sm:self-auto" />
        </div>
      </Surface>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Surface key={index} className="flex min-h-48 flex-col justify-between border p-5">
            <div className="space-y-2">
              <SkeletonText className="h-7 w-28" />
              <SkeletonText className="h-4 w-full" />
              <SkeletonText className="h-4 w-[92%]" />
            </div>
            <SkeletonText className="mt-6 h-4 w-24" />
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function PrivacyPageSkeleton() {
  return (
    <article className="space-y-6">
      <header className="space-y-2 text-center">
        <SkeletonText className="mx-auto h-3 w-16" />
        <SkeletonText className="mx-auto h-9 w-72 max-w-full" />
        <SkeletonText className="mx-auto h-4 w-40" />
      </header>
      <div className="mx-auto max-w-3xl space-y-5">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonText className="h-6 w-40" />
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-[95%]" />
            <SkeletonText
              className={`h-4 ${index % 2 === 0 ? "w-4/5" : "w-3/4"}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
