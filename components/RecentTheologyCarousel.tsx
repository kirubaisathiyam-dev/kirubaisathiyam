"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/Icons";
import type { THEOLOGY_SECTIONS } from "@/lib/theology";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type TheologySectionCard = (typeof THEOLOGY_SECTIONS)[number];

type Props = {
  sections: TheologySectionCard[];
};

function TheologyCard({ section }: { section: TheologySectionCard }) {
  return (
    <Link
      href={`/theology/${section.slug}`}
      className="group flex h-full flex-col border"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--muted-background)",
      }}
    >
      {section.image ? (
        <div
          className="relative aspect-square w-full overflow-hidden border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <Image
            src={section.image}
            alt={section.label}
            fill
            sizes="(min-width: 768px) 24rem, 80vw"
            className="object-cover transition duration-300"
          />
        </div>
      ) : null}
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold group-hover:underline">
              {section.label}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {section.description}
            </p>
          </div>
        </div>
      </div>

      <div
        className="mt-auto flex justify-end border-t p-5"
        style={{ borderColor: "var(--border-color)" }}
      >
        <span className="inline-flex items-center" aria-hidden="true">
          <ArrowRightIcon style={{ width: 15, height: 15 }} />
        </span>
      </div>
    </Link>
  );
}

export default function RecentTheologyCarousel({ sections }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    slidesToScroll: 1,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(sections.length > 1);

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
      <div className="space-y-4 md:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex touch-pan-y">
            {sections.map((section) => (
              <div
                key={section.slug}
                className="min-w-0 flex-[0_0_85vw] pl-4"
                style={{ maxWidth: "22rem" }}
              >
                <TheologyCard section={section} />
              </div>
            ))}
          </div>
        </div>

        {/* <div className="flex justify-end gap-2">
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
            aria-label="Previous theology sections"
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
            aria-label="Next theology sections"
          >
            <ArrowRightIcon style={{ width: 18, height: 18 }} />
          </button>
        </div> */}
      </div>

      <div className="hidden gap-6 md:grid md:grid-cols-2">
        {sections.map((section) => (
          <TheologyCard key={section.slug} section={section} />
        ))}
      </div>
    </>
  );
}
