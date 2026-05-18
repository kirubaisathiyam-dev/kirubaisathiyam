import Image from "next/image";
import ShareButton from "@/components/ShareButton";
import VerseOfTheDayShareButton from "@/components/VerseOfTheDayShareButton";
import { toAbsoluteUrl } from "@/lib/seo";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";

export default function VerseOfTheDayOverlay() {
  const verseOfTheDay = getVerseOfTheDay();

  if (!verseOfTheDay) {
    return null;
  }

  const shareUrl = toAbsoluteUrl("/");
  const shareTitle = `Verse Of The Day - ${verseOfTheDay.reference}`;
  const shareTargetId = "verse-of-the-day-share-card";
  const shareText = [
    verseOfTheDay.reference,
    verseOfTheDay.verse,
    verseOfTheDay.explanation,
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <section
      className="relative -mt-8 overflow-hidden sm:-mt-10"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="relative">
        <div
          id={shareTargetId}
          className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[36rem]"
          style={{ backgroundColor: "#111111" }}
        >
          <Image
            src={verseOfTheDay.image}
            alt="Verse of the day landscape"
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 flex min-h-[24rem] items-center justify-center px-5 py-10 pb-24 text-left sm:min-h-[30rem] sm:px-8 sm:pb-28 lg:min-h-[36rem] lg:px-10">
            <div className="mx-auto flex max-w-4xl flex-col items-start justify-center gap-5">
              <div className="space-y-2">
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "rgba(255, 255, 255, 0.78)" }}
                >
                  Verse Of The Day
                </p>
                <h1 className="text-2xl leading-tight text-white sm:text-3xl">
                  {verseOfTheDay.reference}
                </h1>
              </div>

              {verseOfTheDay.verse ? (
                <blockquote className="leading-[1.9] sm:text-xl">
                  <span
                    className="inline"
                    style={{
                      backgroundColor: "var(--heighlight-bible)",
                      color: "var(--foreground)",
                      padding: "0em 0.3em",
                      borderRadius: "0",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }}
                  >
                    {verseOfTheDay.verse}
                  </span>
                </blockquote>
              ) : null}

              <p className="sm:leading-8 text-white sm:text-xl">
                {verseOfTheDay.explanation}
              </p>
            </div>
          </div>
        </div>

        <div
          data-share-exclude="true"
          className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 py-6 sm:px-8 lg:px-10"
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-start gap-3">
            <ShareButton
              title={shareTitle}
              text={shareText}
              url={shareUrl}
              className="shadow-sm"
            />
            <VerseOfTheDayShareButton
              title={shareTitle}
              text={shareText}
              url={shareUrl}
              targetId={shareTargetId}
              className="shadow-sm"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
