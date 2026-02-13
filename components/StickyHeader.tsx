"use client";

import { useEffect, useRef, useState } from "react";

type StickyHeaderProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function StickyHeader({
  children,
  className,
  style,
}: StickyHeaderProps) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
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
  }, []);

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
