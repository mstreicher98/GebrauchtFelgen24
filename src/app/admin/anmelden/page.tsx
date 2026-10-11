import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { Logo } from "@/components/logo";
import { adminPath } from "@/lib/admin-url";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Anmelden" };

/** Login für den Admin-Bereich – nur E-Mail/Passwort (Google/Apple leiten auf die Website-Domain zurück). */
export default async function AdminLoginPage() {
  const me = await getCurrentUser();
  if (me?.role === "admin") redirect(adminPath("/"));

  return (
    <div className="carbon grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Logo id="gf24-admin-login" className="!h-9" />
          <span className="badge badge-brand">Admin</span>
        </div>
        <div className="card p-6 shadow-[var(--shadow)] sm:p-8">
          <h1 className="font-display flex items-center gap-2 text-2xl font-bold uppercase">
            <ShieldCheck className="h-6 w-6 text-brand" aria-hidden="true" /> Admin-Anmeldung
          </h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            {me ? "Dein Konto hat keine Admin-Rechte. Melde dich mit einem Admin-Konto an." : "Nur für das Team von GebrauchtFelgen24."}
          </p>
          <Suspense>
            <LoginForm google={false} apple={false} next={adminPath("/")} forgotHref={`${env.appUrl}/passwort-vergessen`} showRegister={false} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <a href={env.appUrl} className="link">
            ← Zur Website
          </a>
        </p>
      </div>
    </div>
  );
}
