"use client";

type BibleSelectionBarProps = {
  reference: string;
  message: string;
  onCopy: () => void;
  onShare: () => void;
  onClear: () => void;
};

export default function BibleSelectionBar({
  reference,
  message,
  onCopy,
  onShare,
  onClear,
}: BibleSelectionBarProps) {
  return (
      <div
        className="rounded border px-4 py-3 text-sm flex gap-3 flex-row items-center justify-between shadow-sm"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--muted-background)",
        }}
      >
        <div className="space-y-1">
          <p className="text-base font-semibold">{reference}</p>
          {message && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Copy selected verses"
            title="Copy"
          >
            <i className="fa-regular fa-copy" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Share selected verses"
            title="Share"
          >
            <i className="fa-solid fa-share-nodes" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80"
            style={{ borderColor: "var(--border-color)" }}
            aria-label="Clear selected verses"
            title="Clear"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
      </div>
  );
}
