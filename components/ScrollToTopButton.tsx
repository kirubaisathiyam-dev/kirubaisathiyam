"use client";

import { useEffect, useState } from "react";

type ScrollToTopButtonProps = {
  className?: string;
};

export default function ScrollToTopButton({
  className,
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 cursor-pointer rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80 ${
        className ?? ""
      }`}
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--background)",
      }}
      aria-label="Scroll to top"
    >
      <i className="fa-solid fa-arrow-up" aria-hidden="true" />
    </button>
  );
}
