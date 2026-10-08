"use client";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function VerifyEmailNotice({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <MailCheck className="mx-auto h-12 w-12 text-brand" />
      <h1 className="font-display mt-4 text-2xl uppercase">Bitte bestätige deine E-Mail</h1>
      <p className="mt-3 text-muted">
        Wir haben dir eine E-Mail an <strong className="text-fg">{email}</strong> geschickt. Klicke auf den Link darin – danach kannst du inserieren und chatten.
      </p>
      <button
        type="button"
        className="btn btn-outline mt-6"
        disabled={sent}
        onClick={async () => {
          await authClient.sendVerificationEmail({ email, callbackURL: "/konto" });
          setSent(true);
        }}
      >
        {sent ? "E-Mail wurde erneut gesendet" : "E-Mail erneut senden"}
      </button>
    </div>
  );
}
