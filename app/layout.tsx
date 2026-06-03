import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import localFont from "next/font/local";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";
import "./globals.css";
import "cookieconsent/build/cookieconsent.min.css";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import DailyDevotionAutoPush from "@/components/DailyDevotionAutoPush";
import OverflowHyphenation from "@/components/OverflowHyphenation";
import PwaRegister from "@/components/PwaRegister";

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";
const siteDescription =
  "தமிழ் கிறிஸ்தவ கட்டுரைகள், திருச்சபை வரலாறு, இறையியல், தினசரி தியானங்கள், மற்றும் ஆய்வு குறிப்புகளுடன் தமிழ் வேதாகம வாசிப்பு.";
const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-EKHKEXTHL4";
const notoSerifTamil = localFont({
  src: [
    {
      path: "./fonts/NotoSerifTamil-VariableFont_wdth,wght.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "./fonts/NotoSerifTamil-Italic-VariableFont_wdth,wght.ttf",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "தமிழ் கிறிஸ்தவம்",
    "தமிழ் வேதாகமம்",
    "தமிழ் தினசரி தியானம்",
    "திருச்சபை வரலாறு",
    "இறையியல்",
    "Tamil Christian articles",
    "Tamil Holy Bible",
    "Tamil Bible",
    "Daily devotion in Tamil",
    "Tamil daily devotion",
    "Charles Spurgeon daily devotion",
    "Church History in Tamil",
    "Tamil church history",
    "Theology in Tamil",
    "Tamil theology",
    "Systematic theology in Tamil",
    "Reformed theology in Tamil",
    "Study Bible Tamil",
    "Illustrated Bible",
    "Tamil Old Version",
    "Kirubai Sathiyam",
    "Bible study notes",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ta-IN",
    url: "/",
    title: "கிருபை சத்தியம் | Tamil Christian Articles, Bible, Theology & Devotions",
    description: siteDescription,
    siteName,
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "கிருபை சத்தியம் | Tamil Christian Articles, Bible, Theology & Devotions",
    description: siteDescription,
    images: [shareImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ta" className={notoSerifTamil.variable}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Kirubai Sathiyam" />
        <meta name="application-name" content="Kirubai Sathiyam" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#000000"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#ffffff"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon0.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon1.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <CookieConsentBanner />
        <DailyDevotionAutoPush />
        <OverflowHyphenation />
        <PwaRegister />
      </body>
    </html>
  );
}
