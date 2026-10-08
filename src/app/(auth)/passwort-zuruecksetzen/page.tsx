import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Neues Passwort", robots: { index: false } };

export default function ResetPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold uppercase">Neues Passwort</h1>
      <p className="mb-6 mt-1 text-muted">Wähle ein sicheres Passwort mit mindestens 8 Zeichen.</p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
