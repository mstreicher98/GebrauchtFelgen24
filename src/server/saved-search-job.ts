import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { savedSearch, user } from "@/db/schema";
import { emailLayout, escapeHtml, sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import { filtersToParams, parseFilters } from "@/lib/filters";
import { formatPrice, listingUrl } from "@/lib/format";
import { sendPush } from "@/lib/push";
import { findNewMatches } from "@/lib/search";

/** Prüft alle Suchaufträge auf neue Treffer und verschickt eine Sammel-Benachrichtigung. */
export async function runSavedSearchJob() {
  const searches = await db
    .select({ s: savedSearch, email: user.email, name: user.name, notifyEmail: user.notifyEmail, notifyPush: user.notifyPush })
    .from(savedSearch)
    .innerJoin(user, eq(user.id, savedSearch.userId))
    .where(eq(savedSearch.notify, true));

  let sent = 0;
  for (const { s, email, name, notifyEmail, notifyPush } of searches) {
    const checkedAt = new Date();
    const filters = parseFilters(new URLSearchParams(s.query));
    const { rows, total } = await findNewMatches(filters, s.lastCheckedAt);
    await db.update(savedSearch).set({ lastCheckedAt: checkedAt }).where(eq(savedSearch.id, s.id));
    if (total === 0) continue;

    const searchUrl = `${env.appUrl}/suche?${filtersToParams({ ...filters, seite: 1 }).toString()}`;
    if (notifyPush) {
      await sendPush(s.userId, {
        title: `${total} neue Treffer: ${s.name}`,
        body: rows.map((r) => r.title).join(" · ").slice(0, 160),
        url: `/suche?${filtersToParams({ ...filters, seite: 1 }).toString()}`,
        tag: `search-${s.id}`,
      });
    }
    if (notifyEmail) {
      const list = rows
        .map(
          (r) =>
            `<li style="margin:8px 0"><a href="${env.appUrl}${listingUrl(r)}" style="color:#1a1a1d;font-weight:700">${escapeHtml(r.title)}</a><br><span style="color:#8a8a93">${formatPrice(r.priceCents)} · ${escapeHtml(r.zip)} ${escapeHtml(r.city)}</span></li>`,
        )
        .join("");
      await sendMail(
        email,
        `${total} neue Treffer für „${s.name}"`,
        emailLayout({
          title: `Neue Felgen für deine Suche`,
          bodyHtml: `<p>Hallo ${escapeHtml(name)},</p><p>für deinen Suchauftrag <strong>${escapeHtml(s.name)}</strong> gibt es ${total} neue${total === 1 ? "s" : ""} Inserat${total === 1 ? "" : "e"}:</p><ul style="padding-left:18px">${list}</ul>`,
          cta: { label: "Alle Treffer ansehen", url: searchUrl },
        }),
      );
    }
    sent++;
  }
  if (sent) console.info(`[jobs] ${sent} Suchauftrags-Benachrichtigungen verschickt`);
}
