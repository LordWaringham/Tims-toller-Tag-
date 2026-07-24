import type { Metadata } from "next";
import { Aufnahmestudio } from "@/components/Aufnahmestudio";

export const metadata: Metadata = {
  title: "Sprechtexte aufnehmen — Tims toller Tag",
  description: "Alle Sätze des Spiels mit eigener Stimme einsprechen.",
  robots: { index: false, follow: false },
};

export default function AufnahmeSeite() {
  return <Aufnahmestudio />;
}
