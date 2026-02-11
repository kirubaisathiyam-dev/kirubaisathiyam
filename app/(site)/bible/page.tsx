import BibleReader from "@/components/BibleReader";
import { Suspense } from "react";

export default function BiblePage() {
  return (
    <Suspense
      fallback={
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          Loading bible...
        </div>
      }
    >
      <BibleReader />
    </Suspense>
  );
}
