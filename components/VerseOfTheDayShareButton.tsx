"use client";

import { toBlob } from "html-to-image";

type VerseOfTheDayShareButtonProps = {
  title: string;
  text: string;
  url: string;
  targetId: string;
  className?: string;
};

export default function VerseOfTheDayShareButton({
  title,
  text,
  url,
  targetId,
  className,
}: VerseOfTheDayShareButtonProps) {
  const handleShare = async () => {
    try {
      const target = document.getElementById(targetId);
      if (!target) {
        return "error";
      }

      const blob = await toBlob(target, {
        cacheBust: true,
        pixelRatio: 2,
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
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleShare();
      }}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full border p-3 text-sm font-semibold transition hover:opacity-80 ${
        className ?? ""
      }`}
      style={{
        borderColor: "var(--theme-border-color)",
        backgroundColor: "var(--theme-foreground-bible)",
        color: "var(--theme-foreground-contrast)",
      }}
      aria-label="Share or download verse image"
    >
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
      <span className="sr-only">Share Image</span>
    </button>
  );
}
