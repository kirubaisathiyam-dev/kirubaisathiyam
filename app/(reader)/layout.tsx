import BibleReferenceTooltip from "@/components/BibleReferenceTooltip";
import ReaderShell from "@/components/ReaderShell";

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReaderShell>
      {children}
      <BibleReferenceTooltip />
    </ReaderShell>
  );
}
