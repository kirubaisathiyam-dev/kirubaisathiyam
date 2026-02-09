"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const storageKey = "ks_admin_auth";
const authEvent = "ks-admin-auth-change";

function getSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(storageKey) === "true";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(authEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(authEvent, callback);
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthed = useSyncExternalStore(subscribe, getSnapshot, () => null);

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
