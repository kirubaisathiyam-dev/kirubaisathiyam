import Image from "next/image";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";

export default function VerseOfTheDay() {
  const verseOfTheDay = getVerseOfTheDay();

  if (!verseOfTheDay) {
    return null;
  }

  return (
    <section className="" style={{ borderColor: "var(--border-color)" }}>
      <div className="grid gap-0 sm:grid-cols-2">
        <div
          className="relative min-h-[18rem] overflow-hidden border-b sm:min-h-[24rem] sm:border-b-0 sm:border-r lg:min-h-[32rem]"
          style={{ borderColor: "var(--border-color)" }}
        >
          <Image
            src={verseOfTheDay.image}
            alt="Verse of the day landscape"
            fill
            sizes="(min-width: 1024px) 56rem, 100vw"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        <div className="flex flex-col justify-center gap-5 p-5 sm:p-8 lg:p-10">
          <div className="space-y-2">
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Verse Of The Day
            </p>
            <h1 className="text-2xl leading-tight sm:text-3xl">
              {verseOfTheDay.reference}
            </h1>
          </div>

          {verseOfTheDay.verse ? (
            <blockquote
              className="text-lg sm:text-xl leading-8"
              style={{ color: "var(--muted-foreground)" }}
            >
              {verseOfTheDay.verse}
            </blockquote>
          ) : null}

          <p className="text-lg sm:text-xl leading-8">
            {verseOfTheDay.explanation}
          </p>
        </div>
      </div>
    </section>
  );
}
