"use client";

import { CloseIcon, CopyIcon, PlayIcon, ShareIcon } from "@/components/Icons";

type BibleSelectionBarProps = {
  reference: string;
  message: string;
  onCopy: () => void;
  onShare: () => void;
  onMeditate?: () => void;
  onClear: () => void;
};

export default function BibleSelectionBar({
  reference,
  message,
  onCopy,
  onShare,
  onMeditate,
  onClear,
}: BibleSelectionBarProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded border px-4 py-3 text-sm shadow-sm"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--muted-background)",
      }}
    >
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-base font-semibold">{reference}</p>
          {message && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {message}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Copy selected verses"
            title="Copy"
          >
            <CopyIcon style={{ width: 15, height: 15 }} />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Share selected verses"
            title="Share"
          >
            <ShareIcon style={{ width: 15, height: 15 }} />
          </button>
          {onMeditate ? (
            <button
              type="button"
              onClick={onMeditate}
              className="rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80"
              style={{ borderColor: "var(--border-color)" }}
              aria-label="Open meditation mode"
              title="Meditate"
            >
              <PlayIcon style={{ width: 15, height: 15 }} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Clear selected verses"
            title="Clear"
          >
            <CloseIcon style={{ width: 15, height: 15 }} />
          </button>
        </div>
    </div>
  );
}
