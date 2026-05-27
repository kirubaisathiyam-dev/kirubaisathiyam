"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/Icons";

type UnsplashImageResponse = {
  url: string;
  photographerName: string | null;
  photographerUrl: string | null;
  unsplashUrl: string | null;
  source: "unsplash" | "picsum";
};

type DevotionHeroProps = {
  slug: string;
  label: string;
  verseReference: string;
  verseText: string;
  initialImage: UnsplashImageResponse;
  targetId?: string;
  shareOnlyContent?: ReactNode;
};

function getDevotionImageStorageKey(slug: string) {
  return `hero-image:v3:devotion:${slug}`;
}

function readCachedDevotionImage(slug: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getDevotionImageStorageKey(slug));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as UnsplashImageResponse;
  } catch {
    return null;
  }
}

function writeCachedDevotionImage(slug: string, image: UnsplashImageResponse) {
  if (typeof window === "undefined" || !image.url) {
    return;
  }

  try {
    window.localStorage.setItem(
      getDevotionImageStorageKey(slug),
      JSON.stringify(image),
    );
  } catch {
    // Ignore storage failures.
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function DevotionHero({
  slug,
  label,
  verseReference,
  verseText,
  initialImage,
  targetId,
  shareOnlyContent,
}: DevotionHeroProps) {
  const [image, setImage] = useState(initialImage);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      const cachedImage = readCachedDevotionImage(slug);
      const nextImage =
        cachedImage?.url && cachedImage.source === "unsplash"
          ? cachedImage
          : await fetchJson<UnsplashImageResponse>(
              `/api/unsplash-photo?context=devotion&id=${encodeURIComponent(slug)}`,
            );

      if (!isMounted || !nextImage?.url) {
        return;
      }

      writeCachedDevotionImage(slug, nextImage);
      setImageLoadFailed(false);
      setImage(nextImage);
    }

    void loadImage();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const shouldShowImage = Boolean(image.url) && !imageLoadFailed;

  return (
    <section className="relative -mt-4 overflow-hidden sm:-mt-10">
      <div
        id={targetId}
        className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[36rem]"
        style={{ backgroundColor: "#111111" }}
      >
        {shouldShowImage ? (
          <Image
            src={image.url}
            alt={`${label} devotion`}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
            onError={() => setImageLoadFailed(true)}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex min-h-[24rem] items-center justify-center px-5 py-10 text-left sm:min-h-[30rem] sm:px-8 lg:min-h-[36rem] lg:px-10">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            <Link
              href="/"
              data-share-exclude="true"
              className="transition hover:opacity-80"
              style={{ color: "#ffffff" }}
              aria-label="Back to home"
            >
              <ArrowLeftIcon style={{ width: 16, height: 16 }} />
            </Link>
            <div className="space-y-2">
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: "rgba(255, 255, 255, 0.78)" }}
                data-share-exclude="true"
              >
                {label}
              </p>
              <h1
                className="text-3xl font-semibold leading-tight text-white sm:text-4xl"
                data-share-exclude="true"
              >
                {verseReference}
              </h1>
            </div>

            {verseText ? (
              <blockquote
                className="text-lg leading-[1.9] text-white sm:text-xl"
                data-share-exclude="true"
              >
                {verseText}
              </blockquote>
            ) : null}
          </div>
        </div>

        {shareOnlyContent}
      </div>
    </section>
  );
}
