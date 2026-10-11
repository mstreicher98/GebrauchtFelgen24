"use server";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { adminLog, hsnTsn, legalVersion, listing, listingImage, message, report, session, user, vehicleGeneration, vehicleMake, vehicleModel, vehicleWheelSpec } from "@/db/schema";
import { emailLayout, escapeHtml, sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import { slugify } from "@/lib/format";
import { getLegalDoc, isLegalSlug, LEGAL_DOCS } from "@/lib/legal";
import { findPlaceholders } from "@/lib/legal-markdown";
import { deleteStoredImage } from "@/lib/images";
import { getCurrentUser } from "@/lib/session";
import { fromViennaInput, writeSiteBanner } from "@/lib/site-banner";
import { parseVehicleCsv } from "@/lib/vehicle-csv";
import { importVehicleRows, type ImportSummary } from "@/lib/vehicle-transfer";
import { parseSpec } from "../../../data/vehicles/types";

type Admin = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

async function admin() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") throw new Error("Keine Berechtigung");
  return me;
}

/** Jede Admin-Aktion landet im Protokoll (Bereich „Protokoll“). */
async function log(me: Admin, action: string, targetType: string | null = null, targetId: string | number | null = null, details: string | null = null) {
  await db.insert(adminLog).values({ adminId: me.id, action, targetType, targetId: targetId == null ? null : String(targetId), details: details?.slice(0, 1000) ?? null });
}

/* ---------------- Meldungen ---------------- */

export async function resolveReport(id: number, resolution = "") {
  const me = await admin();
  await db
    .update(report)
    .set({ status: "erledigt", handledAt: new Date(), handledById: me.id, resolution: resolution.trim().slice(0, 500) || null })
    .where(eq(report.id, id));
  await log(me, "Meldung erledigt", "report", id, resolution.trim() || null);
  revalidatePath("/admin", "layout");
}

export async function reopenReport(id: number) {
  const me = await admin();
  await db.update(report).set({ status: "offen", handledAt: null, handledById: null }).where(eq(report.id, id));
  await log(me, "Meldung wieder geöffnet", "report", id);
  revalidatePath("/admin", "layout");
}

/** Offene Meldungen zu einer Unterhaltung und ihren Nachrichten erledigen. */
export async function resolveConversationReports(conversationId: string) {
  const me = await admin();
  const msgIds = db.select({ id: sql<string>`${message.id}::text` }).from(message).where(eq(message.conversationId, conversationId));
  const rows = await db
    .update(report)
    .set({ status: "erledigt", handledAt: new Date(), handledById: me.id })
    .where(
      and(
        eq(report.status, "offen"),
        or(and(eq(report.targetType, "conversation"), eq(report.targetId, conversationId)), and(eq(report.targetType, "message"), inArray(report.targetId, msgIds))),
      ),
    )
    .returning({ id: report.id });
  await log(me, "Meldungen erledigt", "conversation", conversationId, `${rows.length} Meldung(en)`);
  revalidatePath("/admin", "layout");
}

/* ---------------- Inserate ---------------- */

export async function adminSetListingStatus(id: number, status: "aktiv" | "gesperrt" | "deaktiviert") {
  const me = await admin();
  await db.update(listing).set({ status, updatedAt: new Date() }).where(eq(listing.id, id));
  await log(me, `Inserat ${status === "aktiv" ? "freigegeben" : status}`, "listing", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

export async function adminFeatureListing(id: number, days: number) {
  const me = await admin();
  await db
    .update(listing)
    .set({ featuredUntil: days > 0 ? new Date(Date.now() + days * 86400_000) : null })
    .where(eq(listing.id, id));
  await log(me, days > 0 ? `TOP für ${days} Tage` : "TOP entfernt", "listing", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

export async function adminDeleteListing(id: number) {
  const me = await admin();
  const [l] = await db.select({ title: listing.title }).from(listing).where(eq(listing.id, id)).limit(1);
  if (!l) return { error: "Inserat nicht gefunden" };
  const imgs = await db.select({ key: listingImage.key }).from(listingImage).where(eq(listingImage.listingId, id));
  await db.delete(listing).where(eq(listing.id, id));
  for (const i of imgs) void deleteStoredImage(i.key);
  await log(me, "Inserat gelöscht", "listing", id, l.title);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return {};
}

/* ---------------- Nutzer ---------------- */

export async function adminSetBanned(userId: string, banned: boolean) {
  const me = await admin();
  if (userId === me.id) throw new Error("Du kannst dich nicht selbst sperren.");
  await db.update(user).set({ banned }).where(eq(user.id, userId));
  if (banned) {
    await db.delete(session).where(eq(session.userId, userId));
    await db.update(listing).set({ status: "gesperrt" }).where(and(eq(listing.userId, userId), eq(listing.status, "aktiv")));
  }
  await log(me, banned ? "Nutzer gesperrt" : "Nutzer entsperrt", "user", userId);
  revalidatePath("/admin", "layout");
}

export async function adminSetRole(userId: string, role: "user" | "admin") {
  const me = await admin();
  if (userId === me.id) throw new Error("Eigene Rolle kann nicht geändert werden.");
  await db.update(user).set({ role }).where(eq(user.id, userId));
  await log(me, role === "admin" ? "Admin-Rechte vergeben" : "Admin-Rechte entzogen", "user", userId);
  revalidatePath("/admin", "layout");
}

export async function adminVerifyEmail(userId: string) {
  const me = await admin();
  await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, userId));
  await log(me, "E-Mail manuell bestätigt", "user", userId);
  revalidatePath("/admin", "layout");
}

export async function adminRevokeSessions(userId: string) {
  const me = await admin();
  const ended = await db.delete(session).where(eq(session.userId, userId)).returning({ id: session.id });
  await log(me, "Sitzungen beendet", "user", userId, `${ended.length} Sitzung(en)`);
  revalidatePath("/admin", "layout");
  return {};
}

export async function adminSaveUserNote(userId: string, note: string) {
  const me = await admin();
  await db.update(user).set({ adminNote: note.trim().slice(0, 4000) || null }).where(eq(user.id, userId));
  await log(me, "Interne Notiz geändert", "user", userId);
  revalidatePath("/admin", "layout");
  return {};
}

/** Löscht ein Konto endgültig (z. B. auf DSGVO-Anfrage) samt Inseraten, Chats und Bildern. */
export async function adminDeleteUser(userId: string) {
  const me = await admin();
  if (userId === me.id) return { error: "Das eigene Konto bitte unter „Mein Konto“ löschen." };
  const [u] = await db.select({ email: user.email, role: user.role, logo: user.companyLogoKey }).from(user).where(eq(user.id, userId)).limit(1);
  if (!u) return { error: "Nutzer nicht gefunden" };
  if (u.role === "admin") return { error: "Bitte zuerst die Admin-Rechte entziehen." };
  const imgs = await db.select({ key: listingImage.key }).from(listingImage).where(eq(listingImage.userId, userId));
  await db.delete(user).where(eq(user.id, userId));
  for (const i of imgs) void deleteStoredImage(i.key);
  if (u.logo) void deleteStoredImage(u.logo);
  await log(me, "Nutzer gelöscht", "user", userId, u.email);
  revalidatePath("/admin", "layout");
  return {};
}

/* ---------------- Rechtstexte ---------------- */

/** Speichert eine neue Fassung von Impressum, Datenschutz oder AGB (jede Fassung bleibt im Verlauf erhalten). */
export async function adminSaveLegal(slug: string, content: string): Promise<{ error?: string; unchanged?: boolean }> {
  const me = await admin();
  if (!isLegalSlug(slug)) return { error: "Unbekannte Seite" };
  const text = content.replace(/\r\n?/g, "\n").trim();
  if (text.length < 20) return { error: "Der Text ist zu kurz." };
  if (text.length > 100_000) return { error: "Der Text ist zu lang (max. 100.000 Zeichen)." };
  const current = await getLegalDoc(slug);
  if (current.versionId && current.content === text) return { unchanged: true };
  await db.insert(legalVersion).values({ slug, content: text, createdById: me.id });
  const open = findPlaceholders(text).length;
  await log(me, `${LEGAL_DOCS[slug].title} geändert`, "legal", slug, open ? `${open} Platzhalter offen` : null);
  revalidatePath(LEGAL_DOCS[slug].path);
  revalidatePath("/admin", "layout");
  return {};
}

/* ---------------- Einstellungen ---------------- */

const bannerSchema = z.object({
  text: z.string().trim().min(3, "Bitte einen Text eingeben").max(240, "Maximal 240 Zeichen"),
  tone: z.enum(["info", "warnung", "erfolg"]),
  link: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || /^(https?:\/\/|\/)/.test(v), "Link muss mit https:// oder / beginnen"),
  until: z.string().trim().max(30),
});

export async function adminSaveBanner(input: unknown): Promise<{ error?: string }> {
  const me = await admin();
  const r = bannerSchema.safeParse(input);
  if (!r.success) return { error: r.error.issues[0].message };
  const until = r.data.until ? fromViennaInput(r.data.until) : null;
  if (r.data.until && !until) return { error: "Ungültiges Datum" };
  await writeSiteBanner({ text: r.data.text, tone: r.data.tone, link: r.data.link || null, until: until?.toISOString() ?? null });
  await log(me, "Website-Hinweis gesetzt", "setting", "site_banner", r.data.text);
  revalidatePath("/", "layout");
  return {};
}

export async function adminClearBanner() {
  const me = await admin();
  await writeSiteBanner(null);
  await log(me, "Website-Hinweis entfernt", "setting", "site_banner");
  revalidatePath("/", "layout");
  return {};
}

export async function adminSendTestMail(): Promise<{ error?: string }> {
  const me = await admin();
  if (!env.smtp.host) return { error: "SMTP ist nicht eingerichtet (SMTP_HOST fehlt)." };
  const ok = await sendMail(
    me.email,
    "Test-E-Mail – GebrauchtFelgen24",
    emailLayout({ title: "E-Mail-Versand funktioniert", bodyHtml: `<p>Hallo ${escapeHtml(me.name)},</p><p>diese Test-E-Mail wurde aus dem Admin-Bereich verschickt.</p>` }),
  );
  await log(me, ok ? "Test-E-Mail gesendet" : "Test-E-Mail fehlgeschlagen", "setting", "smtp");
  return ok ? {} : { error: "Versand fehlgeschlagen – Details stehen im Server-Log." };
}

/* ---------------- Fahrzeugdatenbank ---------------- */

export async function adminCreateMake(type: "auto" | "motorrad", name: string) {
  const me = await admin();
  const n = name.trim();
  if (!n) return { error: "Name fehlt" };
  await db.insert(vehicleMake).values({ type, name: n, slug: slugify(n) }).onConflictDoNothing();
  await log(me, "Marke angelegt", "vehicle_make", null, n);
  revalidatePath("/admin/fahrzeuge");
  return {};
}

export async function adminCreateModel(makeId: number, name: string) {
  const me = await admin();
  const n = name.trim();
  if (!n) return { error: "Name fehlt" };
  await db.insert(vehicleModel).values({ makeId, name: n, slug: slugify(n) }).onConflictDoNothing();
  await log(me, "Modell angelegt", "vehicle_make", makeId, n);
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
  return {};
}

export async function adminDeleteModel(makeId: number, modelId: number) {
  const me = await admin();
  await db.delete(vehicleModel).where(and(eq(vehicleModel.id, modelId), eq(vehicleModel.makeId, makeId)));
  await log(me, "Modell gelöscht", "vehicle_model", modelId);
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
}

export type GenerationInput = {
  id?: number;
  modelId: number;
  name: string;
  yearFrom: string;
  yearTo: string;
  pcd: string;
  centerBore: string;
  thread: string;
  fastener: string;
  etMin: string;
  etMax: string;
  specs: string;
  notes: string;
};

const num = (s: string) => {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function adminSaveGeneration(makeId: number, g: GenerationInput): Promise<{ error?: string }> {
  const me = await admin();
  if (!g.name.trim()) return { error: "Name fehlt" };
  let parsed;
  try {
    parsed = g.specs
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .flatMap(parseSpec);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const pcd = g.pcd.trim().replace(",", ".").match(/^(\d+)x([\d.]+)$/);
  if (g.pcd.trim() && !pcd) return { error: "Lochkreis im Format 5x112 angeben" };
  const diameters = parsed.map((s) => s.diameter);
  const widths = parsed.map((s) => s.width).filter((w): w is number => w != null);
  const values = {
    modelId: g.modelId,
    name: g.name.trim(),
    yearFrom: num(g.yearFrom),
    yearTo: num(g.yearTo),
    boltCount: pcd ? Number(pcd[1]) : null,
    boltCircle: pcd ? Number(pcd[2]) : null,
    centerBore: num(g.centerBore),
    thread: g.thread.trim() || null,
    fastener: g.fastener.trim() || null,
    etMin: num(g.etMin),
    etMax: num(g.etMax),
    diameterMin: diameters.length ? Math.floor(Math.min(...diameters)) : null,
    diameterMax: diameters.length ? Math.ceil(Math.max(...diameters)) : null,
    widthMin: widths.length ? Math.min(...widths) - 0.5 : null,
    widthMax: widths.length ? Math.max(...widths) + 0.5 : null,
    notes: g.notes.trim() || null,
  };
  await db.transaction(async (tx) => {
    let id = g.id;
    if (id) await tx.update(vehicleGeneration).set(values).where(eq(vehicleGeneration.id, id));
    else [{ id }] = await tx.insert(vehicleGeneration).values(values).returning({ id: vehicleGeneration.id });
    await tx.delete(vehicleWheelSpec).where(eq(vehicleWheelSpec.generationId, id!));
    if (parsed.length) await tx.insert(vehicleWheelSpec).values(parsed.map((s) => ({ ...s, generationId: id! })));
  });
  await log(me, g.id ? "Baureihe geändert" : "Baureihe angelegt", "vehicle_generation", g.id ?? null, values.name);
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
  return {};
}

export async function adminDeleteGeneration(makeId: number, id: number) {
  const me = await admin();
  await db.delete(vehicleGeneration).where(eq(vehicleGeneration.id, id));
  await log(me, "Baureihe gelöscht", "vehicle_generation", id);
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
}

/** Fahrzeugliste (CSV) importieren – mit apply=false nur prüfen und zählen (Vorschau). */
export async function adminImportVehicles(csv: string, apply: boolean): Promise<{ summary?: ImportSummary; errors: string[] }> {
  const me = await admin();
  if (csv.length > 1_900_000) return { errors: ["Die Datei ist zu groß (max. ca. 1,9 MB). Bitte in mehrere Dateien aufteilen."] };
  const { rows, errors, columns } = parseVehicleCsv(csv);
  if (!rows.length) return { errors: errors.length ? errors.slice(0, 50) : ["Keine gültigen Zeilen gefunden."] };
  const summary = await importVehicleRows(rows, columns, apply);
  if (apply) {
    await log(
      me,
      "Fahrzeugliste importiert",
      "vehicle_make",
      null,
      `${summary.makes} Marken, ${summary.models} Modelle, ${summary.generationsNew} neue / ${summary.generationsUpdated} aktualisierte Baureihen`,
    );
    revalidatePath("/admin", "layout");
    revalidatePath("/fahrzeuge", "layout");
  }
  return { summary, errors: errors.slice(0, 50) };
}

/** CSV-Import: HSN;TSN;Generation-ID;Beschreibung (eine Zeile pro Eintrag) */
export async function adminImportHsnTsn(csv: string): Promise<{ imported: number; errors: string[] }> {
  const me = await admin();
  const errors: string[] = [];
  const rows: { hsn: string; tsn: string; generationId: number; description: string | null }[] = [];
  for (const [i, line] of csv.split(/\r?\n/).entries()) {
    const l = line.trim();
    if (!l || l.startsWith("#") || /^hsn/i.test(l)) continue;
    const [hsn, tsn, gid, ...desc] = l.split(/[;,\t]/).map((x) => x.trim());
    if (!/^\d{1,4}$/.test(hsn ?? "") || !/^[A-Z0-9]{3}$/i.test(tsn ?? "") || !Number(gid)) {
      errors.push(`Zeile ${i + 1}: ungültig („${l}")`);
      continue;
    }
    rows.push({ hsn: hsn.padStart(4, "0"), tsn: tsn.toUpperCase(), generationId: Number(gid), description: desc.join(" ") || null });
  }
  const ids = [...new Set(rows.map((r) => r.generationId))];
  const existing = ids.length ? await db.select({ id: vehicleGeneration.id }).from(vehicleGeneration).where(inArray(vehicleGeneration.id, ids)) : [];
  const ok = new Set(existing.map((e) => e.id));
  const valid = rows.filter((r) => {
    if (!ok.has(r.generationId)) errors.push(`${r.hsn}/${r.tsn}: Generation ${r.generationId} existiert nicht`);
    return ok.has(r.generationId);
  });
  for (let i = 0; i < valid.length; i += 500) {
    const chunk = valid.slice(i, i + 500);
    for (const r of chunk) {
      await db
        .insert(hsnTsn)
        .values(r)
        .onConflictDoUpdate({ target: [hsnTsn.hsn, hsnTsn.tsn], set: { generationId: r.generationId, description: r.description } });
    }
  }
  await log(me, "HSN/TSN importiert", "hsn_tsn", null, `${valid.length} Einträge`);
  revalidatePath("/admin/hsn-tsn");
  return { imported: valid.length, errors: errors.slice(0, 50) };
}
