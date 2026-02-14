"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import StickyHeader from "@/components/StickyHeader";
import ThemeToggle from "@/components/ThemeToggle";
import logoDark from "@/app/logo-dark.svg";
import logoLight from "@/app/logo-light.svg";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <StickyHeader
        className="border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="mx-auto flex w-full items-center justify-between gap-6 px-4 py-5 lg:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-semibold tracking-tight sm:text-xl"
          >
            <Image
              src={logoLight}
              alt="Kirubai Sathiyam logo"
              width={36}
              height={36}
              priority
              className="block dark:hidden"
            />
            <Image
              src={logoDark}
              alt="Kirubai Sathiyam logo"
              width={36}
              height={36}
              priority
              className="hidden dark:block"
            />
            <div>
              கிருபை{" "}
              <span style={{ color: "var(--foreground-bible)" }}>
                சத்தியம்
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 text-base hover:opacity-70"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-drawer"
            onClick={() => setOpen((prev) => !prev)}
          >
            <i
              className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`}
              aria-hidden="true"
            ></i>
          </button>
        </div>
      </StickyHeader>

      <div
        className={`fixed inset-0 z-[60] transition ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 cursor-pointer bg-black/50"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <aside
          id="site-drawer"
          className={`absolute right-0 top-0 h-full w-72 max-w-[80vw] transform border-l shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            background: "var(--background)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--border-color)" }}
          >
            <span className="text-base font-semibold">Menu</span>
            <button
              type="button"
              className="cursor-pointer text-base hover:opacity-70"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
          <nav className="flex flex-col gap-4 px-5 py-6 text-base">
            <Link
              href="/bible"
              className="rounded-md px-3 py-2 hover:opacity-70"
              onClick={() => setOpen(false)}
            >
              Bible
            </Link>
            <Link
              href="/articles"
              className="rounded-md px-3 py-2 hover:opacity-70"
              onClick={() => setOpen(false)}
            >
              கட்டுரைகள்
            </Link>
            <div
              className="flex items-center justify-between rounded-md border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span>Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}
