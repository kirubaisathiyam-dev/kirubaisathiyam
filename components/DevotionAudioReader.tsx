"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { getDevotionAudioScrollTop } from "@/lib/devotion-audio-scroll";

type DevotionAudioReaderProps = {
  audio?: string;
  devotionHtml: string;
  attribution: string;
  children?: ReactNode;
};

export default function DevotionAudioReader({
  audio,
  devotionHtml,
  attribution,
  children,
}: DevotionAudioReaderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef<number | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audio) {
      return;
    }

    const audioElement = audioRef.current;
    const contentElement = contentRef.current;

    if (!audioElement || !contentElement) {
      return;
    }

    const stopScrollAnimation = () => {
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
    };

    const easeInOutCubic = (value: number) =>
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const animateScrollTo = (targetTop: number, durationMs = 420) => {
      stopScrollAnimation();

      const startTop = window.scrollY;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 2) {
        window.scrollTo({ top: targetTop, behavior: "auto" });
        return;
      }

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const easedProgress = easeInOutCubic(progress);

        window.scrollTo({
          top: startTop + distance * easedProgress,
          behavior: "auto",
        });

        if (progress < 1) {
          scrollAnimationFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        scrollAnimationFrameRef.current = null;
      };

      scrollAnimationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const syncScroll = () => {
      if (typeof window === "undefined") {
        return;
      }

      const rect = contentElement.getBoundingClientRect();
      const contentTop = rect.top + window.scrollY;
      const targetTop = getDevotionAudioScrollTop({
        contentTop,
        contentHeight: contentElement.offsetHeight,
        viewportHeight: window.innerHeight,
        currentTime: audioElement.currentTime,
        duration: audioElement.duration,
      });

      if (targetTop === null) {
        return;
      }

      if (
        lastScrollTopRef.current !== null &&
        Math.abs(lastScrollTopRef.current - targetTop) < 8
      ) {
        return;
      }

      lastScrollTopRef.current = targetTop;
      animateScrollTo(targetTop);
    };

    const handleTimeUpdate = () => {
      if (!audioElement.paused) {
        window.requestAnimationFrame(syncScroll);
      }
    };

    const handleLoadedMetadata = () => {
      lastScrollTopRef.current = null;
    };

    const handleEnded = () => {
      syncScroll();
    };

    const handleSeeked = () => {
      lastScrollTopRef.current = null;
      syncScroll();
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("seeked", handleSeeked);
    window.addEventListener("resize", syncScroll);

    return () => {
      stopScrollAnimation();
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("seeked", handleSeeked);
      window.removeEventListener("resize", syncScroll);
    };
  }, [audio]);

  return (
    <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 sm:mt-10">
      {audio ? (
        <div
          className="py-2"
          style={{ borderColor: "var(--border-color)" }}
        >
          <audio
            ref={audioRef}
            className="w-full"
            controls
            src={audio}
            preload="metadata"
          >
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
      ) : null}

      <div
        ref={contentRef}
        className="prose prose-neutral max-w-none text-base leading-8 sm:text-lg"
        style={{ color: "var(--foreground)" }}
        dangerouslySetInnerHTML={{ __html: devotionHtml }}
      />

      <p
        className="text-sm sm:text-base"
        style={{ color: "rgba(255, 255, 255, 0.5)" }}
      >
        {attribution}
      </p>

      {children}
    </div>
  );
}
