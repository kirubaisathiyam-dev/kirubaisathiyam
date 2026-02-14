"use client";

import { useState } from "react";

type ShareButtonProps = {
  title: string;
  text?: string;
  url: string;
  className?: string;
};

export default function ShareButton({
  title,
  text,
  url,
  className,
}: ShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleShare = async () => {
    try {
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
        borderColor: "var(--border-color)",
        backgroundColor: "var(--background)",
      }}
      aria-label={label}
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <i className="fa-solid fa-share-nodes" aria-hidden="true" />
    </button>
  );
}
