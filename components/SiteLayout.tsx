import SubscribeForm from "@/components/SubscribeForm";
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
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-6 px-4 py-5">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight sm:text-xl"
          >
            Kirubai Sathiyam
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:text-base">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span style={{ color: "var(--muted-foreground)" }}>|</span>
            <Link href="/articles" className="hover:underline">
              Articles
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
        {children}
      </main>

      <footer
        className="border-t"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
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
