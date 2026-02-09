import Link from "next/link";

type SiteLayoutProps = {
  children: React.ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="min-h-screen">
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

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
        {children}
      </main>

      <footer
        className="border-t"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-6 text-sm">
          <span style={{ color: "var(--muted-foreground)" }}>
            © {new Date().getFullYear()} Kirubai Sathiyam
          </span>
        </div>
      </footer>
    </div>
  );
}
