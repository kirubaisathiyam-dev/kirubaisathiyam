import type { Metadata } from "next";
import Script from "next/script";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";
import "./globals.css";
import "cookieconsent/build/cookieconsent.min.css";
import CookieConsentBanner from "@/components/CookieConsentBanner";

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";
const siteDescription =
  "Tamil Christian articles and the Tamil Holy Bible reader with study notes.";
const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Tamil Christian articles",
    "Tamil Holy Bible",
    "Tamil Bible",
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
    title: siteName,
    description: siteDescription,
    siteName,
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: siteName,
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
    <html lang="ta">
      <head>
        <meta name="apple-mobile-web-app-title" content="Kirubai Sathiyam" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        <Script
          src="https://kit.fontawesome.com/944b74851d.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
