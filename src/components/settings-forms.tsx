"use client";
import { clsx } from "clsx";
import { Building2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateNotifications, updateProfile } from "@/app/actions/account";
import { setBlocked } from "@/app/actions/chat";
import { authClient } from "@/lib/auth-client";
import { PlzInput } from "./plz-input";
import { subscribePush, unsubscribePush } from "./push-opt-in";
import { toast } from "./toaster";

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-xl uppercase tracking-wide">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

type Profile = {
  name: string;
  email: string;
  accountType: "privat" | "haendler";
  companyName: string;
  companyUid: string;
  companyWebsite: string;
  phone: string;
  zip: string;
  zipLabel: string;
  country: "AT" | "DE" | "CH";
  bio: string;
};

export function ProfileSettings({ initial }: { initial: Profile }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof Profile>(k: K, val: Profile[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <Card title="Profil" sub="Diese Angaben sehen Käufer in deinen Inseraten (Telefonnummer nur, wenn du sie im Inserat freigibst).">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await updateProfile(v);
            setErrors(r.errors ?? {});
            if (r.error) toast(r.error, "error");
            else if (!r.errors) {
              toast("Profil gespeichert");
              router.refresh();
            }
          });
        }}
      >
        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
          {(
            [
              ["privat", "Privatperson", User],
              ["haendler", "Gewerblicher Händler", Building2],
            ] as const
          ).map(([val, l, Icon]) => (
            <button key={val} type="button" onClick={() => set("accountType", val)} className={clsx("flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all", v.accountType === val ? "border-brand bg-brand-soft text-brand" : "border-line text-muted")}>
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
        {v.accountType === "haendler" && (
          <>
            <F label="Firmenname" error={errors.companyName}>
              <input className="input" value={v.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </F>
            <F label="UID-Nummer (optional)">
              <input className="input" value={v.companyUid} onChange={(e) => set("companyUid", e.target.value)} placeholder="ATU12345678" />
            </F>
            <F label="Website (optional)" error={errors.companyWebsite} className="sm:col-span-2">
              <input className="input" value={v.companyWebsite} onChange={(e) => set("companyWebsite", e.target.value)} placeholder="https://" />
            </F>
          </>
        )}
        <F label={v.accountType === "haendler" ? "Ansprechpartner" : "Name"} error={errors.name}>
          <input className="input" value={v.name} onChange={(e) => set("name", e.target.value)} />
        </F>
        <F label="E-Mail">
          <input className="input opacity-60" value={v.email} disabled />
        </F>
        <F label="Telefon (optional)" error={errors.phone}>
          <input className="input" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+43 …" />
        </F>
        <F label="Standort (Standard für Inserate)" error={errors.zip}>
          <PlzInput value={v.zip} initialLabel={v.zipLabel} onChange={(zip, country) => setV((s) => ({ ...s, zip, country: (country as Profile["country"]) ?? s.country }))} />
        </F>
        <F label="Über mich / uns (optional)" className="sm:col-span-2">
          <textarea className="textarea" value={v.bio} onChange={(e) => set("bio", e.target.value)} maxLength={1000} />
        </F>
        <div className="sm:col-span-2">
          <button className="btn btn-brand" disabled={pending}>
            Speichern
          </button>
        </div>
      </form>
    </Card>
  );
}

function F({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-sm text-muted">{sub}</span>
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-surface-3 transition-colors peer-checked:bg-brand-fill" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function NotificationSettings({ notifyEmail, notifyPush }: { notifyEmail: boolean; notifyPush: boolean }) {
  const [email, setEmail] = useState(notifyEmail);
  const [push, setPush] = useState(notifyPush);
  const [deviceSubscribed, setDeviceSubscribed] = useState<boolean | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    navigator.serviceWorker
      ?.getRegistration()
      .then((r) => r?.pushManager.getSubscription())
      .then((s) => setDeviceSubscribed(!!s))
      .catch(() => setDeviceSubscribed(false));
  }, []);

  return (
    <Card title="Benachrichtigungen" sub="Neue Chat-Nachrichten, Treffer für Suchaufträge und ablaufende Inserate.">
      <div className="divide-y divide-line">
        <Toggle
          checked={email}
          onChange={(v) => {
            setEmail(v);
            start(() => updateNotifications(v, push));
          }}
          label="E-Mail"
          sub="max. eine E-Mail pro Unterhaltung alle 15 Minuten"
        />
        <Toggle
          checked={push}
          onChange={(v) => {
            setPush(v);
            start(() => updateNotifications(email, v));
          }}
          label="Push-Benachrichtigungen"
          sub="auf allen Geräten, auf denen du Push erlaubt hast"
        />
      </div>
      {push && deviceSubscribed !== null && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 p-3 text-sm">
          <span className="flex-1 text-muted">{deviceSubscribed ? "Dieses Gerät empfängt Push-Benachrichtigungen." : "Auf diesem Gerät ist Push noch nicht aktiviert."}</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={async () => {
              try {
                if (deviceSubscribed) await unsubscribePush();
                else await subscribePush();
                setDeviceSubscribed(!deviceSubscribed);
                toast(deviceSubscribed ? "Push auf diesem Gerät deaktiviert" : "Push auf diesem Gerät aktiviert");
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            {deviceSubscribed ? "Auf diesem Gerät deaktivieren" : "Auf diesem Gerät aktivieren"}
          </button>
        </div>
      )}
    </Card>
  );
}

export function PasswordSettings() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Passwort ändern">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
          setBusy(false);
          if (error) toast(error.code === "INVALID_PASSWORD" ? "Aktuelles Passwort ist falsch" : (error.message ?? "Fehler"), "error");
          else {
            toast("Passwort geändert – andere Geräte wurden abgemeldet");
            setCurrent("");
            setNext("");
          }
        }}
      >
        <F label="Aktuelles Passwort">
          <input type="password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </F>
        <F label="Neues Passwort (mind. 8 Zeichen)">
          <input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
        </F>
        <div>
          <button className="btn btn-outline" disabled={busy}>
            Passwort ändern
          </button>
        </div>
      </form>
    </Card>
  );
}

export function BlockedUsers({ users }: { users: { id: string; name: string }[] }) {
  const [, start] = useTransition();
  const router = useRouter();
  if (users.length === 0) return null;
  return (
    <Card title="Blockierte Nutzer">
      <ul className="divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between py-2.5">
            <span>{u.name}</span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() =>
                start(async () => {
                  await setBlocked(u.id, false);
                  router.refresh();
                })
              }
            >
              Freigeben
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DangerZone({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <section className="rounded-[1.25rem] border border-red/30 p-5 sm:p-6">
      <h2 className="font-display text-xl uppercase tracking-wide text-red">Konto löschen</h2>
      <p className="mt-1 text-sm text-muted">Alle deine Inserate, Fotos, Chats und Daten werden endgültig gelöscht (DSGVO Art. 17).</p>
      {!open ? (
        <button type="button" className="btn btn-outline btn-sm mt-4 hover:!border-red hover:!text-red" onClick={() => setOpen(true)}>
          Konto löschen …
        </button>
      ) : (
        <form
          className="animate-fade-in mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!confirm("Wirklich endgültig löschen? Das kann nicht rückgängig gemacht werden.")) return;
            setBusy(true);
            const { error } = await authClient.deleteUser(hasPassword ? { password, callbackURL: "/" } : { callbackURL: "/" });
            setBusy(false);
            if (error) {
              toast(error.code === "SESSION_EXPIRED" ? "Bitte melde dich erneut an und versuche es dann noch einmal." : (error.message ?? "Löschen fehlgeschlagen"), "error");
              return;
            }
            toast("Dein Konto wurde gelöscht");
            router.push("/");
            router.refresh();
          }}
        >
          {hasPassword && (
            <input type="password" className="input sm:max-w-xs" placeholder="Passwort zur Bestätigung" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          )}
          <button className="btn btn-danger" disabled={busy}>
            Endgültig löschen
          </button>
        </form>
      )}
    </section>
  );
}
