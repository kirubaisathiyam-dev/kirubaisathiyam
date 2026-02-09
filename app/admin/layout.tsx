"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const storageKey = "ks_admin_auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    setIsAuthed(stored === "true");
  }, []);

  useEffect(() => {
    if (isAuthed === false && pathname !== "/admin") {
      router.replace("/admin");
    }
  }, [isAuthed, pathname, router]);

  if (isAuthed === null) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm">
          Checking access...
        </main>
      </div>
    );
  }

  if (!isAuthed && pathname !== "/admin") {
    return (
      <div className="min-h-screen">
        <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm">
          Access denied.{" "}
          <Link href="/admin" className="font-semibold hover:underline">
            Go to login
          </Link>
          .
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header
        className="border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <h1 className="text-lg font-semibold">Admin</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
