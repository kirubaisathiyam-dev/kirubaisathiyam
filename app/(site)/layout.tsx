import SiteLayout from "@/components/SiteLayout";

export default function SiteRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout>{children}</SiteLayout>;
}
