import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Passwort vergessen", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold uppercase">Passwort vergessen</h1>
      <p className="mb-6 mt-1 text-muted">Wir schicken dir einen Link zum Zurücksetzen.</p>
      <ForgotPasswordForm />
    </>
  );
}
