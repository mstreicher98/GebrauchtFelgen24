import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, block, user } from "@/db/schema";
import { BlockedUsers, DangerZone, NotificationSettings, PasswordSettings, ProfileSettings } from "@/components/settings-forms";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const me = await requireUser("/konto/einstellungen");
  const [blocked, accounts] = await Promise.all([
    db
      .select({ id: user.id, name: user.name, company: user.companyName })
      .from(block)
      .innerJoin(user, eq(user.id, block.blockedId))
      .where(eq(block.blockerId, me.id)),
    db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, me.id)),
  ]);
  const hasPassword = accounts.some((a) => a.providerId === "credential");

  return (
    <div className="space-y-6">
      <ProfileSettings
        initial={{
          name: me.name,
          email: me.email,
          accountType: me.accountType,
          companyName: me.companyName ?? "",
          companyUid: me.companyUid ?? "",
          companyWebsite: me.companyWebsite ?? "",
          phone: me.phone ?? "",
          zip: me.zip ?? "",
          zipLabel: me.zip ? `${me.zip} ${me.city ?? ""}`.trim() : "",
          country: (me.country as "AT" | "DE" | "CH") ?? "AT",
          bio: me.bio ?? "",
        }}
      />
      <NotificationSettings notifyEmail={me.notifyEmail} notifyPush={me.notifyPush} />
      {hasPassword && <PasswordSettings />}
      <BlockedUsers users={blocked.map((b) => ({ id: b.id, name: b.company ?? b.name }))} />
      <DangerZone hasPassword={hasPassword} />
    </div>
  );
}
