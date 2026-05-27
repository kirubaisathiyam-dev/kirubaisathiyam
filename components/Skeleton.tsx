import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  tone?: "default" | "contrast";
};

export function SkeletonBlock({
  className = "",
  style,
  tone = "default",
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-block ${
        tone === "contrast" ? "skeleton-block-contrast" : ""
      } ${className}`}
      style={style}
    />
  );
}

export function SkeletonText({
  className = "",
  style,
  tone = "default",
}: SkeletonProps) {
  return (
    <SkeletonBlock
      className={`h-4 ${className}`}
      style={style}
      tone={tone}
    />
  );
}

export function SkeletonCircle({
  className = "",
  style,
  tone = "default",
}: SkeletonProps) {
  return (
    <SkeletonBlock
      className={className}
      style={style}
      tone={tone}
    />
  );
}
