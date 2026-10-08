"use client";
import { clsx } from "clsx";
import { Building2, Eye, EyeOff, MailCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "./logo";

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/konto";
}

const ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-Mail oder Passwort ist falsch.",
  EMAIL_NOT_VERIFIED: "Bitte bestätige zuerst deine E-Mail-Adresse – wir haben dir eben einen neuen Link geschickt.",
  USER_ALREADY_EXISTS: "Mit dieser E-Mail-Adresse gibt es bereits ein Konto.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Mit dieser E-Mail-Adresse gibt es bereits ein Konto.",
  PASSWORD_TOO_SHORT: "Das Passwort muss mindestens 8 Zeichen lang sein.",
  INVALID_TOKEN: "Der Link ist ungültig oder abgelaufen.",
  TOO_MANY_REQUESTS: "Zu viele Versuche – bitte warte kurz.",
};
const msg = (e: { code?: string; message?: string; status?: number } | null | undefined) =>
  (e?.code && ERRORS[e.code]) || (e?.status === 429 ? ERRORS.TOO_MANY_REQUESTS : undefined) || e?.message || "Es ist ein Fehler aufgetreten.";

export function SocialButtons({ google, apple, next }: { google: boolean; apple: boolean; next: string }) {
  if (!google && !apple) return null;
  return (
    <>
      <div className="grid gap-2">
        {google && (
          <button type="button" className="btn btn-outline w-full" onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
            </svg>
            Mit Google fortfahren
          </button>
        )}
        {apple && (
          <button type="button" className="btn btn-outline w-full" onClick={() => authClient.signIn.social({ provider: "apple", callbackURL: next })}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 .1-2.2.7-3 1.6-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.5z" />
            </svg>
            Mit Apple fortfahren
          </button>
        )}
      </div>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-faint">
        <span className="h-px flex-1 bg-line" /> oder mit E-Mail <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} className="input pr-11" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required minLength={8} />
      <button type="button" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-faint hover:text-fg" onClick={() => setShow((s) => !s)} aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ google, apple }: { google: boolean; apple: boolean }) {
  const sp = useSearchParams();
  const next = safeNext(sp.get("weiter"));
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(sp.get("error") ? "Anmeldung fehlgeschlagen. Bitte versuche es erneut." : null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <SocialButtons google={google} apple={apple} next={next} />
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const { error: err } = await authClient.signIn.email({ email, password, callbackURL: next, rememberMe: true });
          setBusy(false);
          if (err) return setError(msg(err));
          router.push(next);
          router.refresh();
        }}
      >
        <div>
          <label htmlFor="email" className="label">E-Mail</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Passwort</label>
            <Link href="/passwort-vergessen" className="mb-1.5 text-xs text-muted hover:text-gold">Passwort vergessen?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        {error && <p className="animate-fade-in rounded-xl bg-red-soft px-3 py-2 text-sm text-red">{error}</p>}
        <button className="btn btn-gold w-full" disabled={busy}>
          {busy ? <Spinner className="h-5 w-5 text-on-gold" /> : "Anmelden"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Noch kein Konto?{" "}
        <Link href={`/registrieren${sp.get("weiter") ? `?weiter=${encodeURIComponent(next)}` : ""}`} className="link font-semibold">
          Jetzt registrieren
        </Link>
      </p>
    </>
  );
}

export function RegisterForm({ google, apple }: { google: boolean; apple: boolean }) {
  const sp = useSearchParams();
  const next = safeNext(sp.get("weiter"));
  const [type, setType] = useState<"privat" | "haendler">("privat");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="animate-scale-in text-center">
        <MailCheck className="mx-auto h-14 w-14 text-gold" />
        <h2 className="font-display mt-4 text-2xl uppercase">Fast geschafft!</h2>
        <p className="mt-3 text-muted">
          Wir haben dir eine E-Mail an <strong className="text-fg">{email}</strong> geschickt. Bitte klicke auf den Bestätigungslink, um dein Konto zu aktivieren.
        </p>
        <p className="mt-4 text-xs text-faint">Keine E-Mail erhalten? Schau im Spam-Ordner nach.</p>
      </div>
    );
  }

  return (
    <>
      <SocialButtons google={google} apple={apple} next={next} />
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!terms) return setError("Bitte akzeptiere die AGB und die Datenschutzerklärung.");
          setBusy(true);
          setError(null);
          const { error: err } = await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            accountType: type,
            companyName: type === "haendler" ? company.trim() : undefined,
            callbackURL: next,
          } as Parameters<typeof authClient.signUp.email>[0]);
          setBusy(false);
          if (err) return setError(msg(err));
          setDone(true);
        }}
      >
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Kontotyp">
          {(
            [
              ["privat", "Privat", User],
              ["haendler", "Händler", Building2],
            ] as const
          ).map(([v, l, Icon]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={type === v}
              onClick={() => setType(v)}
              className={clsx("flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all", type === v ? "border-gold bg-gold-soft text-gold" : "border-line text-muted")}
            >
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
        {type === "haendler" && (
          <div className="animate-fade-in">
            <label htmlFor="company" className="label">Firmenname</label>
            <input id="company" className="input" value={company} onChange={(e) => setCompany(e.target.value)} required autoComplete="organization" />
          </div>
        )}
        <div>
          <label htmlFor="name" className="label">{type === "haendler" ? "Ansprechpartner" : "Name"}</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" maxLength={80} />
        </div>
        <div>
          <label htmlFor="email" className="label">E-Mail</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password" className="label">Passwort (mind. 8 Zeichen)</label>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={clsx("h-1 flex-1 rounded-full transition-colors", strength(password) > i ? (strength(password) > 2 ? "bg-green" : "bg-gold") : "bg-surface-3")} />
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--gold)]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            Ich akzeptiere die <Link href="/agb" className="link" target="_blank">AGB</Link> und habe die{" "}
            <Link href="/datenschutz" className="link" target="_blank">Datenschutzerklärung</Link> gelesen.
          </span>
        </label>
        {error && <p className="animate-fade-in rounded-xl bg-red-soft px-3 py-2 text-sm text-red">{error}</p>}
        <button className="btn btn-gold w-full" disabled={busy}>
          {busy ? <Spinner className="h-5 w-5 text-on-gold" /> : "Konto erstellen"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Schon registriert? <Link href="/anmelden" className="link font-semibold">Anmelden</Link>
      </p>
    </>
  );
}

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (sent) {
    return (
      <p className="animate-fade-in text-center text-muted">
        Falls ein Konto mit <strong className="text-fg">{email}</strong> existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
      </p>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await authClient.requestPasswordReset({ email, redirectTo: "/passwort-zuruecksetzen" });
        setBusy(false);
        setSent(true);
      }}
    >
      <div>
        <label htmlFor="email" className="label">E-Mail</label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <button className="btn btn-gold w-full" disabled={busy}>Link anfordern</button>
    </form>
  );
}

export function ResetPasswordForm() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(sp.get("error") ? ERRORS.INVALID_TOKEN : null);
  const [busy, setBusy] = useState(false);
  if (!token) return <p className="text-center text-red">{ERRORS.INVALID_TOKEN}</p>;
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error: err } = await authClient.resetPassword({ newPassword: password, token });
        setBusy(false);
        if (err) return setError(msg(err));
        router.push("/anmelden?zurueckgesetzt=1");
      }}
    >
      <div>
        <label htmlFor="password" className="label">Neues Passwort</label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
      </div>
      {error && <p className="rounded-xl bg-red-soft px-3 py-2 text-sm text-red">{error}</p>}
      <button className="btn btn-gold w-full" disabled={busy}>Passwort speichern</button>
    </form>
  );
}
