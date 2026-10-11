import { sql } from "drizzle-orm";
import { CircleCheck, CircleMinus } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/db";
import { adminSendTestMail } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { BannerForm } from "@/components/admin-forms";
import { AdminPageHeader } from "@/components/admin-ui";
import { SiteBanner } from "@/components/site-banner";
import { env, oauthEnabled } from "@/lib/env";
import { getSetting } from "@/lib/settings";
import { getSiteBanner, readSiteBanner, toViennaInput } from "@/lib/site-banner";

export const metadata: Metadata = { title: "Einstellungen" };

function Status({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  const Icon = ok ? CircleCheck : CircleMinus;
  return (
    <li className="flex items-start gap-2.5 py-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ok ? "text-green" : "text-faint"}`} aria-hidden="true" />
      <span className="sr-only">{ok ? "Aktiv:" : "Nicht aktiv:"}</span>
      <span className="min-w-0">
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </li>
  );
}

export default async function AdminSettingsPage() {
  const [stored, active, vapid, [db0]] = await Promise.all([
    readSiteBanner(),
    getSiteBanner(),
    getSetting("vapid_public").catch(() => null),
    db.execute<{ size: string; version: string }>(sql`select pg_size_pretty(pg_database_size(current_database())) as size, current_setting('server_version') as version`),
  ]);
  const expired = stored && !active;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Einstellungen" sub="Website-Hinweis und Systemstatus." />

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg uppercase">Website-Hinweis</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Erscheint als Leiste über der Kopfzeile auf allen Seiten – z. B. für Wartungsarbeiten oder Neuigkeiten.</p>
        {active && (
          <div className="mb-4 overflow-hidden rounded-xl border border-line">
            <p className="bg-surface-2 px-3 py-1.5 text-xs text-muted">Vorschau (aktiv)</p>
            <SiteBanner banner={active} />
          </div>
        )}
        {expired && <p className="mb-4 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">Der gespeicherte Hinweis ist abgelaufen und wird nicht mehr angezeigt.</p>}
        <BannerForm
          active={!!stored}
          initial={{ text: stored?.text ?? "", tone: stored?.tone ?? "info", link: stored?.link ?? "", until: toViennaInput(stored?.until ?? null) }}
        />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg uppercase">Systemstatus</h2>
        <ul className="mt-2 divide-y divide-[var(--border)] text-sm">
          <Status ok label="Datenbank" hint={`PostgreSQL ${db0.version} · ${db0.size}`} />
          <Status ok={!!env.smtp.host} label="E-Mail-Versand (SMTP)" hint={env.smtp.host ? `${env.smtp.host}:${env.smtp.port} · Absender ${env.smtp.from}` : "Nicht eingerichtet – E-Mails werden nur ins Log geschrieben."} />
          <Status ok={!!vapid || !!process.env.VAPID_PUBLIC_KEY} label="Web-Push" hint="VAPID-Schlüssel (werden beim Start automatisch erzeugt)" />
          <Status ok={oauthEnabled.google} label="Login mit Google" />
          <Status ok={oauthEnabled.apple} label="Login mit Apple" />
          <Status ok={!!env.adminUrl} label="Eigene Admin-Adresse" hint={env.adminUrl ?? "ADMIN_URL nicht gesetzt – Admin-Bereich liegt unter /admin."} />
          <Status ok={!env.seedDemo} label="Demo-Daten deaktiviert" hint={env.seedDemo ? "SEED_DEMO=true – in Produktion bitte auf false setzen." : undefined} />
        </ul>
        <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="inline text-muted">Website: </dt>
            <dd className="inline">{env.appUrl}</dd>
          </div>
          <div>
            <dt className="inline text-muted">Inserat-Laufzeit: </dt>
            <dd className="inline">{env.listingLifetimeDays} Tage</dd>
          </div>
        </dl>
        <ActionButton action={adminSendTestMail} success="Test-E-Mail verschickt – bitte Posteingang prüfen" className="btn btn-outline btn-sm mt-4">
          Test-E-Mail an mich senden
        </ActionButton>
      </section>
    </div>
  );
}
