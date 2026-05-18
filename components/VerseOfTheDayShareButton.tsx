"use client";

import { toBlob } from "html-to-image";
import ShareButton from "@/components/ShareButton";

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
          text,
          url,
          files: [file],
        });
        return "shared";
      }

      if (navigator.share) {
        await navigator.share({ title, text, url });
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
    <ShareButton
      title={title}
      text={text}
      url={url}
      className={className}
      onShare={handleShare}
    />
  );
}
