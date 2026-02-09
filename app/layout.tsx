import type { Metadata } from "next";
import "./globals.css";
import "cookieconsent/build/cookieconsent.min.css";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import SiteLayout from "@/components/SiteLayout";

export const metadata: Metadata = {
  title: {
    default: "Kirubai Sathiyam",
    template: "%s | Kirubai Sathiyam",
  },
  description: "Tamil articles and reflections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ta">
      <head>
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
      </head>
      <body className="antialiased">
        <SiteLayout>{children}</SiteLayout>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
