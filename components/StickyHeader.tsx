"use client";

import { useEffect, useRef, useState } from "react";

type StickyHeaderProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hideOnScroll?: boolean;
};

export default function StickyHeader({
  children,
  className,
  style,
  hideOnScroll,
}: StickyHeaderProps) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const shouldHideOnScroll =
    hideOnScroll ??
    process.env.NEXT_PUBLIC_STICKY_HEADER_HIDE_ON_SCROLL !== "false";

  useEffect(() => {
    if (!shouldHideOnScroll) {
      return;
    }

    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const current = window.scrollY;

      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(() => {
          const delta = current - lastScrollY.current;
          const nearTop = current < 64;

          if (nearTop) {
            setHidden(false);
          } else if (delta > 8) {
            setHidden(true);
          } else if (delta < -8) {
            setHidden(false);
          }

          lastScrollY.current = current;
          ticking.current = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [shouldHideOnScroll]);

  return (
    <header
      className={`sticky top-0 z-50 transition-transform duration-300 ${
        className ?? ""
      }`}
      style={{
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        backgroundColor: "var(--background)",
        ...style,
      }}
    >
      {children}
    </header>
  );
}
