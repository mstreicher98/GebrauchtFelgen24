import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Allgemeine Geschäftsbedingungen" };

export default function TermsPage() {
  return <LegalPage slug="agb" />;
}
