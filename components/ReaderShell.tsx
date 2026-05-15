"use client";

import { ArrowLeftIcon } from "@/components/Icons";
import { useApplyReaderSettings } from "@/components/ReaderSettingsButton";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type ReaderShellProps = {
  children: React.ReactNode;
};

export default function ReaderShell({ children }: ReaderShellProps) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement | null>(null);
  useApplyReaderSettings(shellRef);

  return (
    <div ref={shellRef} className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/");
          }}
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
