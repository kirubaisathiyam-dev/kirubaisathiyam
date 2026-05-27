import type { Metadata } from "next";
import { Suspense } from "react";
import MeditationExperience from "@/components/MeditationExperience";

export const metadata: Metadata = {
  title: "Meditate on Scripture",
  description:
    "Open a single Bible verse in a full-screen meditation view with themed background visuals and ambient audio.",
  alternates: {
    canonical: "/meditate",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function MeditatePage() {
  return (
    <Suspense fallback={null}>
      <MeditationExperience />
    </Suspense>
  );
}
