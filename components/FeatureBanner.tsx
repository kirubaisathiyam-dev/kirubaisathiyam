"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/Icons";

type FeatureBannerProps = {
  id: string;
  enabled: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  accentColor: string;
  background: string;
};

function getStorageKey(id: string) {
  return `feature-banner-dismissed:${id}`;
}

export default function FeatureBanner({
  id,
  enabled,
  title,
  description,
  ctaLabel,
  ctaHref,
  accentColor,
  background,
}: FeatureBannerProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      setDismissed(true);
      return;
    }

    const storageKey = getStorageKey(id);
    setDismissed(window.localStorage.getItem(storageKey) === "true");
    setReady(true);
  }, [enabled, id]);

  if (!enabled || !ready || dismissed) {
    return null;
  }

  return (
    <div
      className="border-b"
      style={{
        borderColor: "var(--border-color)",
        background,
      }}
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: accentColor }}>
                {title}
              </p>
              <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--foreground)" }}>
                {description}
              </p>
            </div>
            <div>
              <a
                href={ctaHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex whitespace-nowrap px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: accentColor,
                  color: "#fff",
                }}
              >
                {ctaLabel}
              </a>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close banner"
          className="inline-flex shrink-0 items-center justify-center transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
          onClick={() => {
            window.localStorage.setItem(getStorageKey(id), "true");
            setDismissed(true);
          }}
        >
          <CloseIcon style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </div>
  );
}
