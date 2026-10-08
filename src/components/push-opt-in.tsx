"use client";
import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "./toaster";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Dein Browser unterstützt keine Push-Benachrichtigungen.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Benachrichtigungen wurden nicht erlaubt.");
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const { publicKey } = await fetch("/api/push").then((r) => r.json());
  if (!publicKey) throw new Error("Push ist auf dem Server nicht konfiguriert.");
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
  const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  if (!res.ok) throw new Error("Abo konnte nicht gespeichert werden.");
}

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker?.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
  }
}

/** Kleiner Hinweis „Benachrichtigungen aktivieren", nur wenn noch nicht entschieden. */
export function PushOptIn() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nur im Browser bekannt
    setShow("Notification" in window && "serviceWorker" in navigator && Notification.permission === "default");
  }, []);
  if (!show) return null;
  return (
    <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft p-3 text-left text-sm">
      <BellRing className="h-5 w-5 shrink-0 text-brand" />
      <span className="flex-1">Push-Benachrichtigungen für neue Nachrichten aktivieren?</span>
      <button
        type="button"
        className="btn btn-brand btn-sm"
        onClick={async () => {
          try {
            await subscribePush();
            toast("Benachrichtigungen aktiviert");
          } catch (e) {
            toast((e as Error).message, "error");
          }
          setShow(false);
        }}
      >
        Aktivieren
      </button>
    </div>
  );
}
