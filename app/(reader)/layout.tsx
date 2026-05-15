import ReaderShell from "@/components/ReaderShell";

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReaderShell>{children}</ReaderShell>;
}
