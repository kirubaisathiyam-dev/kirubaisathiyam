"use client";

import { ArrowLeftIcon } from "@/components/Icons";
import { useApplyReaderSettings } from "@/components/ReaderSettingsButton";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

type ReaderShellProps = {
  children: React.ReactNode;
};

export default function ReaderShell({ children }: ReaderShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement | null>(null);
  useApplyReaderSettings(shellRef);

  const getBackHref = () => {
    if (!pathname) return "/";
    if (pathname.startsWith("/articles/")) return "/articles";
    if (pathname.startsWith("/bible/read")) return "/bible";
    if (pathname.startsWith("/theology/")) {
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length >= 3) {
        return `/theology/${parts[1]}#${parts[2]}`;
      }
      return "/theology";
    }
    return "/";
  };

  return (
    <div ref={shellRef} className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push(getBackHref())}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:opacity-80"
          style={{ color: "var(--foreground)" }}
          aria-label="Go back"
        >
          <ArrowLeftIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6 sm:pb-10">
        {children}
      </main>
    </div>
  );
}
