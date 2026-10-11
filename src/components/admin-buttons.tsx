"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "./toaster";

/** Button, der eine Server-Action ausführt und danach neu lädt. */
export function ActionButton({
  action,
  children,
  confirmText,
  className = "btn btn-outline btn-sm",
  success,
  redirectTo,
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
  success?: string;
  /** Nach Erfolg dorthin wechseln (z. B. nach dem Löschen) statt neu zu laden */
  redirectTo?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        start(async () => {
          try {
            const r = (await action()) as { error?: string } | undefined;
            if (r?.error) return toast(r.error, "error");
            if (success) toast(success);
            if (redirectTo) router.push(redirectTo);
            router.refresh();
          } catch (e) {
            toast((e as Error).message, "error");
          }
        });
      }}
    >
      {children}
    </button>
  );
}
