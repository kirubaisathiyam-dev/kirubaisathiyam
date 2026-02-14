import BibleReferenceTooltip from "@/components/BibleReferenceTooltip";
import SiteHeader from "@/components/SiteHeader";
import SubscribeForm from "@/components/SubscribeForm";

type SiteLayoutProps = {
  children: React.ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

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
