"use client";

import { useState } from "react";
import { LoadingIcon, ShareIcon } from "@/components/Icons";

type ShareButtonProps = {
  title: string;
  text?: string;
  url: string;
  className?: string;
  buttonStyle?: React.CSSProperties;
  onShare?: () => Promise<"shared" | "copied" | "error" | void> | "shared" | "copied" | "error" | void;
};

export default function ShareButton({
  title,
  text,
  url,
  className,
  buttonStyle,
  onShare,
}: ShareButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "sharing" | "copied" | "error"
  >("idle");

  const handleShare = async () => {
    if (status === "sharing") {
      return;
    }

    setStatus("sharing");

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
      setStatus("idle");
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const label =
    status === "sharing"
      ? "Sharing..."
      : status === "copied"
      ? "Copied!"
      : status === "error"
        ? "Try again"
        : "Share";
  const isLoading = status === "sharing";

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isLoading}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full border p-3 text-sm font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-80 ${
        className ?? ""
      }`}
      style={{
        borderColor: "var(--theme-border-color)",
        backgroundColor: "var(--theme-foreground-bible)",
        color: "var(--theme-foreground-contrast)",
        ...buttonStyle,
      }}
      aria-label={label}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <span className="sr-only">{label}</span>
      {isLoading ? (
        <LoadingIcon style={{ width: 20, height: 20 }} />
      ) : (
        <ShareIcon style={{ width: 20, height: 20 }} />
      )}
    </button>
  );
}
