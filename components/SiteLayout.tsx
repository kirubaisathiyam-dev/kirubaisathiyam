import BibleReferenceTooltip from "@/components/BibleReferenceTooltip";
import SubscribeForm from "@/components/SubscribeForm";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

type SiteLayoutProps = {
  children: React.ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="mx-auto flex w-full items-center justify-between gap-6 lg:px-6 px-4 py-5">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight sm:text-xl"
          >
            கிருபை <span style={{ color: "var(--foreground-bible)" }}>சத்தியம்</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:text-base">
            <Link href="/articles" className="hover:underline">
              கட்டுரைகள்
            </Link>
            <span style={{ color: "var(--muted-foreground)" }}>|</span>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        {children}
        <BibleReferenceTooltip />
      </main>

      <footer
        className="border-t"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              புதிய கட்டுரைகள் உங்கள் மின்னஞ்சலில்
            </p>
            <SubscribeForm />
          </div>
          <span
            className="block text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            © {new Date().getFullYear()} Kirubai Sathiyam
          </span>
        </div>
      </footer>
    </div>
  );
}
