"use client";

import { useState } from "react";
import { toBlob } from "html-to-image";
import { LoadingIcon } from "@/components/Icons";

type VerseOfTheDayShareButtonProps = {
  title: string;
  text: string;
  url: string;
  targetId: string;
  className?: string;
};

async function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      try {
        await image.decode();
      } catch {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }
    }),
  );
}

export default function VerseOfTheDayShareButton({
  title,
  url,
  targetId,
  className,
}: VerseOfTheDayShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    let captureWrapper: HTMLDivElement | null = null;
    let captureTarget: HTMLElement | null = null;

    try {
      const target = document.getElementById(targetId);
      if (!target) {
        return "error";
      }

      const targetRect = target.getBoundingClientRect();
      captureWrapper = document.createElement("div");
      captureWrapper.style.position = "fixed";
      captureWrapper.style.left = "0";
      captureWrapper.style.top = "0";
      captureWrapper.style.width = `${targetRect.width}px`;
      captureWrapper.style.height = `${targetRect.height}px`;
      captureWrapper.style.overflow = "hidden";
      captureWrapper.style.opacity = "0";
      captureWrapper.style.pointerEvents = "none";
      captureWrapper.style.zIndex = "2147483647";

      captureTarget = target.cloneNode(true) as HTMLElement;
      captureTarget.removeAttribute("id");
      captureTarget.style.width = `${targetRect.width}px`;
      captureTarget.style.height = `${targetRect.height}px`;
      captureTarget
        .querySelectorAll<HTMLElement>("[data-share-only='true']")
        .forEach((element) => {
          element.style.display = "flex";
        });
      captureWrapper.appendChild(captureTarget);
      document.body.appendChild(captureWrapper);
      await waitForImages(captureTarget);

      const blob = await toBlob(captureTarget, {
        cacheBust: true,
        height: targetRect.height,
        pixelRatio: 2,
        width: targetRect.width,
        filter: (node) => {
          if (!(node instanceof HTMLElement)) {
            return true;
          }
          return node.dataset.shareExclude !== "true";
        },
      });
      if (!blob) {
        return "error";
      }

      const file = new File([blob], "verse-of-the-day.png", {
        type: "image/png",
      });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title,
          url,
          files: [file],
        });
        return "shared";
      }

      if (navigator.share) {
        await navigator.share({ title, url });
        return "shared";
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "verse-of-the-day.png";
      link.click();
      URL.revokeObjectURL(downloadUrl);
      return "copied";
    } catch {
      return "error";
    } finally {
      captureWrapper?.remove();
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={() => {
        void handleShare();
      }}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full border p-3 text-sm font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-80 ${
        className ?? ""
      }`}
      style={{
        borderColor: "var(--theme-border-color)",
        backgroundColor: "var(--theme-foreground-bible)",
        color: "var(--theme-foreground-contrast)",
      }}
      aria-label={isLoading ? "Preparing verse image" : "Share or download verse image"}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <LoadingIcon style={{ width: 20, height: 20 }} />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 20,
            height: 20,
            display: "inline-block",
            backgroundColor: "currentColor",
            maskImage: "url('/icons/line-md-image.svg')",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
            WebkitMaskImage: "url('/icons/line-md-image.svg')",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
          }}
        />
      )}
      <span className="sr-only">
        {isLoading ? "Preparing verse image" : "Share Image"}
      </span>
    </button>
  );
}
