"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/Icons";

type ShareButtonProps = {
  title: string;
  text?: string;
  url: string;
  className?: string;
  onShare?: () => Promise<"shared" | "copied" | "error" | void> | "shared" | "copied" | "error" | void;
};

export default function ShareButton({
  title,
  text,
  url,
  className,
  onShare,
}: ShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleShare = async () => {
    try {
      if (onShare) {
        const result = await onShare();
        if (result === "copied") {
          setStatus("copied");
          window.setTimeout(() => setStatus("idle"), 2000);
        } else if (result === "error") {
          setStatus("error");
          window.setTimeout(() => setStatus("idle"), 2000);
        } else {
          setStatus("idle");
        }
        return;
      }

      if (navigator.share) {
        await navigator.share({ title, text, url });
        setStatus("idle");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
        window.setTimeout(() => setStatus("idle"), 2000);
        return;
      }

      window.prompt("Copy this link:", url);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const label =
    status === "copied"
      ? "Copied!"
      : status === "error"
        ? "Try again"
        : "Share";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full border p-3 text-sm font-semibold transition hover:opacity-80 ${
        className ?? ""
      }`}
      style={{
        borderColor: "var(--theme-border-color)",
        backgroundColor: "var(--theme-foreground-bible)",
        color: "var(--theme-foreground-contrast)",
      }}
      aria-label={label}
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <ShareIcon style={{ width: 20, height: 20 }} />
    </button>
  );
}
