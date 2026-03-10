"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import StickyHeader from "@/components/StickyHeader";
import ThemeToggle from "@/components/ThemeToggle";
import OfflineDownloader from "@/components/OfflineDownloader";
import logoDark from "@/app/logo-dark.svg";
import logoLight from "@/app/logo-light.svg";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  subscribeTheme,
} from "@/lib/theme";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { resolved: resolvedTheme } = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

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
              src={resolvedTheme === "dark" ? logoDark : logoLight}
              alt="Kirubai Sathiyam logo"
              width={36}
              height={36}
              priority
            />
            <div>
              கிருபை{" "}
              <span style={{ color: "var(--foreground-bible)" }}>சத்தியம்</span>
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
          className={`absolute right-0 top-0 h-full w-72 max-w-[80vw] transform overflow-y-auto border-l shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            background: "var(--background)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center justify-end px-5 py-4">
            <button
              type="button"
              className="cursor-pointer text-base hover:opacity-70"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
          <div
            className="flex flex-col justify-between gap-6 px-5"
            style={{ height: "calc(100% - 60px)" }}
          >
            <div className="space-y-5">
              <nav className="flex flex-col gap-4 px-5 text-base">
                <Link
                  href="/bible"
                  className="rounded-md px-3 py-2 hover:opacity-70"
                  onClick={() => setOpen(false)}
                >
                  பரிசுத்த வேதாகமம்
                </Link>
                <Link
                  href="/articles"
                  className="rounded-md px-3 py-2 hover:opacity-70"
                  onClick={() => setOpen(false)}
                >
                  கட்டுரைகள்
                </Link>
                <Link
                  href="https://whatsapp.com/channel/0029Vb745DA7dmeV8xxmEF23"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md px-3 py-2 hover:opacity-70"
                  onClick={() => setOpen(false)}
                >
                  பரிசுத்த வாழ்க்கை - அனுதின தியானம்
                </Link>
              </nav>
            </div>
            <div
              className="flex flex-col gap-6 items-center border-t justify-center px-3 py-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              <OfflineDownloader className="px-4" />
              <div
                className="flex w-full items-center border-t justify-center px-3 py-4"
                style={{ borderColor: "var(--border-color)" }}
              >
                <ThemeToggle />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
