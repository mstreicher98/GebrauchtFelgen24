import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth-forms";
import { oauthEnabled } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Registrieren" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/konto");
  return (
    <>
      <h1 className="font-display text-3xl font-bold uppercase">Konto erstellen</h1>
      <p className="mb-6 mt-1 text-muted">Kostenlos – für Privatpersonen und Händler.</p>
      <Suspense>
        <RegisterForm google={oauthEnabled.google} apple={oauthEnabled.apple} />
      </Suspense>
    </>
  );
}
