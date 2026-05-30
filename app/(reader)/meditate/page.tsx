import type { Metadata } from "next";
import { Suspense } from "react";
import MeditationExperience from "@/components/MeditationExperience";

export const metadata: Metadata = {
  title: "வேத தியானம் | Scripture Meditation",
  description:
    "ஒரு வேதாகம வசனத்தை முழுத்திரை தியான அனுபவமாக அமைதியான பின்னணி மற்றும் ஒலியுடன் திறக்கவும்.",
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
