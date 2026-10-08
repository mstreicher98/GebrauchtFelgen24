import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { oauthEnabled } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Anmelden", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/anmelden">) {
  const sp = await props.searchParams;
  if (await getCurrentUser()) redirect(typeof sp.weiter === "string" && sp.weiter.startsWith("/") && !sp.weiter.startsWith("//") ? sp.weiter : "/konto");
  return (
    <>
      <h1 className="font-display text-3xl font-bold uppercase">Willkommen zurück</h1>
      <p className="mb-6 mt-1 text-muted">Melde dich an, um zu chatten und zu inserieren.</p>
      {sp.zurueckgesetzt && <p className="mb-4 rounded-xl bg-green-soft px-3 py-2 text-sm text-green">Passwort geändert – bitte melde dich an.</p>}
      <Suspense>
        <LoginForm google={oauthEnabled.google} apple={oauthEnabled.apple} />
      </Suspense>
    </>
  );
}
