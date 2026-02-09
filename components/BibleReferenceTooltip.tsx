"use client";

import { useEffect, useRef, useState } from "react";

type TooltipState = {
  visible: boolean;
  loading: boolean;
  locked: boolean;
  reference: string;
  content: string;
  x: number;
  y: number;
};

const initialState: TooltipState = {
  visible: false,
  loading: false,
  locked: false,
  reference: "",
  content: "",
  x: 0,
  y: 0,
};

const verseCache = new Map<string, { reference: string; content: string }>();

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function positionTooltip(
  rect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
) {
  const margin = 12;
  const maxX = window.innerWidth - tooltipWidth - margin;
  const maxY = window.innerHeight - tooltipHeight - margin;
  const x = clamp(rect.left, margin, maxX);
  const y = clamp(rect.bottom + 8, margin, maxY);
  return { x, y };
}

export default function BibleReferenceTooltip() {
  const [state, setState] = useState<TooltipState>(initialState);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let activeElement: HTMLElement | null = null;

    async function showTooltip(element: HTMLElement, lock: boolean) {
      const passage = element.dataset.passage;
      const reference = element.dataset.ref || passage || "";
      if (!passage) return;

      const cached = verseCache.get(passage);
      if (cached) {
        const rect = element.getBoundingClientRect();
        const tooltipSize = tooltipRef.current?.getBoundingClientRect();
        const { x, y } = positionTooltip(
          rect,
          tooltipSize?.width || 320,
          tooltipSize?.height || 160,
        );

        setState({
          visible: true,
          loading: false,
          locked: lock,
          reference: cached.reference,
          content: cached.content,
          x,
          y,
        });
        return;
      }

      const rect = element.getBoundingClientRect();
      setState((prev) => ({
        ...prev,
        visible: true,
        loading: true,
        locked: lock,
        reference,
        content: "",
        x: rect.left,
        y: rect.bottom + 8,
      }));

      try {
        const response = await fetch(
          `/api/bible?passage=${encodeURIComponent(passage)}`,
        );
        const data = (await response.json()) as {
          ok?: boolean;
          reference?: string;
          content?: string;
        };

        const verse = {
          reference: data.reference || reference,
          content: data.content || "",
        };

        verseCache.set(passage, verse);

        const tooltipSize = tooltipRef.current?.getBoundingClientRect();
        const { x, y } = positionTooltip(
          rect,
          tooltipSize?.width || 320,
          tooltipSize?.height || 160,
        );

        setState({
          visible: true,
          loading: false,
          locked: lock,
          reference: verse.reference,
          content: verse.content,
          x,
          y,
        });
      } catch {
        setState({
          visible: true,
          loading: false,
          locked: lock,
          reference,
          content: "Unable to load verse.",
          x: rect.left,
          y: rect.bottom + 8,
        });
      }
    }

    function handlePointerEnter(event: Event) {
      const target = event.target as Element | null;
      if (!target) return;
      if (!("closest" in target)) return;
      const el = target.closest(".bible-ref") as HTMLElement | null;
      if (!el) return;
      activeElement = el;
      showTooltip(el, false);
    }

    function handlePointerLeave(event: Event) {
      const target = event.target as Element | null;
      if (!target) return;
      if (!("closest" in target)) return;
      const el = target.closest(".bible-ref") as HTMLElement | null;
      if (!el) return;
      if (state.locked) return;
      if (activeElement === el) {
        setState((prev) => ({ ...prev, visible: false, locked: false }));
      }
    }

    function handleClick(event: Event) {
      const target = event.target as Element | null;
      if (!target) return;
      if (!("closest" in target)) {
        if (state.locked) {
          setState((prev) => ({ ...prev, visible: false, locked: false }));
        }
        return;
      }
      const el = target.closest(".bible-ref") as HTMLElement | null;
      if (!el) {
        if (state.locked) {
          setState((prev) => ({ ...prev, visible: false, locked: false }));
        }
        return;
      }
      event.preventDefault();
      showTooltip(el, !state.locked || activeElement !== el);
      activeElement = el;
    }

    document.addEventListener("pointerenter", handlePointerEnter, true);
    document.addEventListener("pointerleave", handlePointerLeave, true);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("pointerenter", handlePointerEnter, true);
      document.removeEventListener("pointerleave", handlePointerLeave, true);
      document.removeEventListener("click", handleClick);
    };
  }, [state.locked]);

  if (!state.visible) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      className="bible-tooltip"
      style={{
        position: "fixed",
        left: state.x,
        top: state.y,
        zIndex: 50,
        maxWidth: "320px",
        background: "var(--background)",
        color: "var(--foreground)",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        padding: "12px 14px",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.15)",
        fontSize: "0.85rem",
      }}
    >
      <div className="text-xs font-semibold" style={{ marginBottom: "0.4rem" }}>
        {state.reference}
      </div>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
        {state.loading ? "Loading..." : state.content || "No verse found."}
      </div>
    </div>
  );
}
