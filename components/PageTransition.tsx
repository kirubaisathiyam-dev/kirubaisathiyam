"use client";

import { usePathname, useSearchParams } from "next/navigation";

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export default function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname || ""}?${searchParams?.toString() || ""}`;

  return (
    <div key={routeKey} className={`page-transition-shell ${className || ""}`}>
      <div aria-hidden="true" className="page-transition-veil" />
      <div className="page-transition-enter">{children}</div>
    </div>
  );
}
