import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

export default function PrivacyPage() {
  return <LegalPage slug="datenschutz" />;
}
