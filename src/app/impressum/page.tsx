import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return <LegalPage slug="impressum" />;
}
