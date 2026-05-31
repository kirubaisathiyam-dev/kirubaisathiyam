"use client";

import { usePathname } from "next/navigation";
import BibleReferenceTooltip from "@/components/BibleReferenceTooltip";
import PageTransition from "@/components/PageTransition";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import ReaderShell from "@/components/ReaderShell";
import SiteHeader from "@/components/SiteHeader";
import SubscribeForm from "@/components/SubscribeForm";
import { EmailIcon, InstagramIcon, YoutubeIcon, WhatsappIcon } from "@/components/Icons";

type SiteLayoutProps = {
  children: React.ReactNode;
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
            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.03) 100%)",
            borderColor: "var(--border-color)",
          }}
          className="border-b"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <div className="space-y-4">
              <div>
                <p className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                  புதிய கட்டுரைகள் உங்கள் மின்னஞ்சலில்
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  தேவை நெறிபடி கட்டுரைகள் மற்றும் வேத செய்திகளைப் பெறுங்கள்
                </p>
              </div>
              <SubscribeForm />
            </div>
          </div>
        </div>

        {/* WhatsApp Channel Section */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(37, 211, 102, 0.04) 100%)",
            borderColor: "var(--border-color)",
          }}
          className="border-b"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <WhatsappIcon style={{ width: 32, height: 32, color: "#25D366" }} />
                  <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                    WhatsApp Channel
                  </h2>
                </div>
                <p className="text-base mb-2" style={{ color: "var(--foreground)" }}>
                  பரிசுத்த வாழ்க்கை - அனுதின தியானம்
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  WhatsApp-இல் தினந்தோறும் தியானம் மற்றும் செய்திகள் பெறுங்கள்
                </p>
              </div>
              <a
                href="https://whatsapp.com/channel/0029Vb745DA7dmeV8xxmEF23"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{
                  background: "#25D366",
                  color: "#fff",
                }}
              >
                <WhatsappIcon style={{ width: 20, height: 20 }} />
                Join Channel
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <span
              className="block text-xs opacity-80 hover:opacity-100"
              style={{ color: "var(--muted-foreground)" }}
            >
              © {new Date().getFullYear()} kirubaisathiyam.org
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="mailto:info@kirubaisathiyam.org"
                title="Email"
                className="inline-flex items-center hover:opacity-70"
                style={{ color: "#FF9500" }}
              >
                <EmailIcon style={{ width: 20, height: 20 }} />
              </a>
              <a
                href="https://www.instagram.com/kirubaisathiyam/"
                target="_blank"
                rel="noreferrer"
                title="Instagram"
                className="inline-flex items-center hover:opacity-70"
                style={{ color: "#E4405F" }}
              >
                <InstagramIcon style={{ width: 20, height: 20 }} />
              </a>
              <a
                href="https://www.youtube.com/@KirubaiSathiyam"
                target="_blank"
                rel="noreferrer"
                title="YouTube"
                className="inline-flex items-center hover:opacity-70"
                style={{ color: "#FF0000" }}
              >
                <YoutubeIcon style={{ width: 20, height: 20 }} />
              </a>
            </div>
          </div>
        </div>
      </footer>
      <PushNotificationPrompt variant="auto" />
    </div>
  );
}
