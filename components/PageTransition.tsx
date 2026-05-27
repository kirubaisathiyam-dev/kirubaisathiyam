"use client";

import { usePathname } from "next/navigation";

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export default function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  const pathname = usePathname();
  const routeKey = pathname || "";

  return (
    <div key={routeKey} className={`page-transition-shell ${className || ""}`}>
      <div aria-hidden="true" className="page-transition-veil" />
      <div className="page-transition-enter">{children}</div>
    </div>
  );
}
