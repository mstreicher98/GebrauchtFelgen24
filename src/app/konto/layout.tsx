import type { Metadata } from "next";
import { AccountNav } from "@/components/account-nav";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mein Konto", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser("/konto");
  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <p className="text-sm text-muted">Hallo,</p>
        <h1 className="font-display text-3xl font-bold uppercase">{me.accountType === "haendler" && me.companyName ? me.companyName : me.name}</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
