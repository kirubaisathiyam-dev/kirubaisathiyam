import Image from "next/image";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";

export default function VerseOfTheDayOverlay() {
  const verseOfTheDay = getVerseOfTheDay();

  if (!verseOfTheDay) {
    return null;
  }

  return (
    <section
      className="relative -mt-8 overflow-hidden sm:-mt-10"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[36rem]">
        <Image
          src={verseOfTheDay.image}
          alt="Verse of the day landscape"
          fill
          sizes="100vw"
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex min-h-[24rem] items-center justify-center px-5 py-10 text-left sm:min-h-[30rem] sm:px-8 lg:min-h-[36rem] lg:px-10">
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
              <blockquote className="text-lg leading-[2] sm:text-xl">
                <span
                  className="inline"
                  style={{
                    backgroundColor: "var(--heighlight-bible)",
                    color: "var(--foreground)",
                    padding: "0.12em 0.22em",
                    borderRadius: "0.15em",
                    boxDecorationBreak: "clone",
                    WebkitBoxDecorationBreak: "clone",
                  }}
                >
                  {verseOfTheDay.verse}
                </span>
              </blockquote>
            ) : null}

            <p className="text-lg leading-8 text-white sm:text-xl">
              {verseOfTheDay.explanation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
