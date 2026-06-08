"use client";

import { usePathname } from "next/navigation";
import BibleReferenceTooltip from "@/components/BibleReferenceTooltip";
import FeatureBanner from "@/components/FeatureBanner";
import PageTransition from "@/components/PageTransition";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import ReaderShell from "@/components/ReaderShell";
import SiteHeader from "@/components/SiteHeader";
import SubscribeForm from "@/components/SubscribeForm";
import { EmailIcon, InstagramIcon, WhatsappIcon, YoutubeIcon } from "@/components/Icons";

type SiteLayoutProps = {
  children: React.ReactNode;
};

const topFeatureBanner = {
  id: "youtube-channel-june-2026",
  enabled: true,
  title: "New Feature",
  description: "Our YouTube channel is now live. Watch Bible reading, prayer, and meditation videos.",
  ctaLabel: "Watch Now",
  ctaHref: "https://www.youtube.com/@KirubaiSathiyam",
  accentColor: "#9e3434",
  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(69, 10, 10, 0.05) 100%)",
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isBibleChapterReader = /^\/bible\/[^/]+\/[^/]+(?:\/[^/]+)?$/.test(
    pathname || "",
  );

  if (isBibleChapterReader) {
    return (
      <div className="flex min-h-screen flex-col">
        <ReaderShell>
          {children}
          <BibleReferenceTooltip />
        </ReaderShell>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <FeatureBanner {...topFeatureBanner} />
      <SiteHeader />

      <main
        className={
          isHomePage
            ? "w-full flex-1 py-8 sm:py-10"
            : "mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10"
        }
      >
        <PageTransition>{children}</PageTransition>
        <BibleReferenceTooltip />
      </main>

      <footer
        className="border-t"
        style={{ borderColor: "var(--border-color)", marginTop: "80px" }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(128, 105, 48, 0.03) 100%)",
            borderColor: "var(--border-color)",
          }}
          className="border-b"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xl font-bold" style={{ color: "var(--foreground)" }}>
                  புதிய கட்டுரைகள் உங்கள் மின்னஞ்சலில்
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  தேவையான கட்டுரைகள் மற்றும் வேத செய்திகளைப் பெறுங்கள்
                </p>
              </div>
              <SubscribeForm />
            </div>
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(8, 37, 19, 0.04) 100%)",
            borderColor: "var(--border-color)",
          }}
          className="border-b"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <WhatsappIcon style={{ width: 32, height: 32, color: "#41905e" }} />
                  <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                    WhatsApp Channel
                  </h2>
                </div>
                <p className="mb-2 text-base" style={{ color: "var(--foreground)" }}>
                  பரிசுத்த வாழ்க்கை - அனுதின தியானம்
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  WhatsApp-இல் தினந்தோறும் தியானம் மற்றும் செய்திகளைப் பெறுங்கள்
                </p>
              </div>
              <a
                href="https://whatsapp.com/channel/0029Vb745DA7dmeV8xxmEF23"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 whitespace-nowrap px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "#41905e",
                  color: "#fff",
                }}
              >
                <WhatsappIcon style={{ width: 20, height: 20 }} />
                Join Channel
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(69, 10, 10, 0.04) 100%)",
            borderColor: "var(--border-color)",
          }}
          className="border-b"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <YoutubeIcon style={{ width: 32, height: 32, color: "#9e3434" }} />
                  <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                    YouTube Channel
                  </h2>
                </div>
                <p className="mb-2 text-base" style={{ color: "var(--foreground)" }}>
                  வேத வசனங்களை கேட்டு தியானிக்க எங்கள் YouTube சேனலை பாருங்கள்.
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  வேத வாசிப்பு, ஜெபம், மற்றும் தியானத்திற்கான காணொளிகள் இங்கே உள்ளன.
                </p>
              </div>
              <a
                href="https://www.youtube.com/@KirubaiSathiyam"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 whitespace-nowrap px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "#9e3434",
                  color: "#fff",
                }}
              >
                <YoutubeIcon style={{ width: 20, height: 20 }} />
                Watch Our Channel
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <span
              className="block text-xs opacity-80 hover:opacity-100"
              style={{ color: "var(--muted-foreground)" }}
            >
              © {new Date().getFullYear()} kirubaisathiyam.org
            </span>
            <div className="flex flex-wrap items-center gap-6 px-2">
              <a
                href="mailto:info@kirubaisathiyam.org"
                title="Email"
                className="inline-flex items-center hover:opacity-70"
                style={{ color: "#b48e59" }}
              >
                <EmailIcon style={{ width: 20, height: 20 }} />
              </a>
              <a
                href="https://www.instagram.com/kirubaisathiyam/"
                target="_blank"
                rel="noreferrer"
                title="Instagram"
                className="inline-flex items-center hover:opacity-70"
                style={{ color: "#914e5a" }}
              >
                <InstagramIcon style={{ width: 20, height: 20 }} />
              </a>
              <a
                href="https://www.youtube.com/@KirubaiSathiyam"
                target="_blank"
                rel="noreferrer"
                title="YouTube"
                className="inline-flex items-center hover:opacity-70"
                style={{ color: "#9e3434" }}
              >
                <YoutubeIcon style={{ width: 20, height: 20 }} />
              </a>
              <a
                href="https://whatsapp.com/channel/0029Vb745DA7dmeV8xxmEF23"
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                className="inline-flex items-center hover:opacity-70"
                style={{ color: "#41905e" }}
              >
                <WhatsappIcon style={{ width: 20, height: 20 }} />
              </a>
            </div>
          </div>
        </div>
      </footer>
      <PushNotificationPrompt variant="auto" />
    </div>
  );
}
