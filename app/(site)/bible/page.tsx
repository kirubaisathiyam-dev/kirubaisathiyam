import type { Metadata } from "next";
import BibleReader from "@/components/BibleReader";
import { Suspense } from "react";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/logo-light.svg");
const siteUrl = getSiteUrl().toString();

export const metadata: Metadata = {
  title: "Tamil Holy Bible Reader",
  description:
    "Read the Tamil Holy Bible online with study notes, illustrated Bible references, and old Tamil Bible versions.",
  keywords: [
    "Tamil Holy Bible",
    "Tamil Bible",
    "Study Bible Tamil",
    "Illustrated Bible",
    "Tamil Old Version",
    "Bible reader",
    "Kirubai Sathiyam",
    "தமிழ் பரிசுத்த வேதாகமம்",
    "தமிழ் ஆய்வு வேதாகமம்",
  ],
  alternates: {
    canonical: "/bible",
  },
  openGraph: {
    type: "website",
    url: "/bible",
    title: "Tamil Holy Bible Reader",
    description:
      "Read the Tamil Holy Bible online with study notes, illustrated Bible references, and old Tamil Bible versions.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "Tamil Holy Bible Reader",
    description:
      "Read the Tamil Holy Bible online with study notes, illustrated Bible references, and old Tamil Bible versions.",
    images: [shareImage],
  },
};

export default function BiblePage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          பரிசுத்த வேதாகமம்
        </h1>
        {/* <p style={{ color: "var(--muted-foreground)" }}>
          Read the Tamil Holy Bible online with study Bible notes, illustrated
          Bible references, and old Tamil Bible versions.
        </p> */}
      </header>
      <Suspense
        fallback={
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border-color)" }}
          >
            Loading bible...
          </div>
        }
      >
        <BibleReader siteUrl={siteUrl} />
      </Suspense>
    </div>
  );
}
