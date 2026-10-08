import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { emailLayout, escapeHtml, sendMail } from "./email";
import { deleteStoredImage } from "./images";
import { env, oauthEnabled } from "./env";

const socialProviders: Parameters<typeof betterAuth>[0]["socialProviders"] = {};
if (oauthEnabled.google) {
  socialProviders.google = {
    clientId: env.google.clientId!,
    clientSecret: env.google.clientSecret!,
    prompt: "select_account",
  };
}
if (oauthEnabled.apple) {
  socialProviders.apple = {
    clientId: env.apple.clientId!,
    clientSecret: env.apple.clientSecret!,
    appBundleIdentifier: env.apple.bundleId,
  };
}

export const auth = betterAuth({
  appName: env.appName,
  baseURL: env.appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  trustedOrigins: [env.appUrl, "https://appleid.apple.com"],
  telemetry: { enabled: false },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail(
        user.email,
        "Passwort zurücksetzen – GebrauchtFelgen24",
        emailLayout({
          title: "Passwort zurücksetzen",
          bodyHtml: `<p>Hallo ${escapeHtml(user.name)},</p><p>du hast angefordert, dein Passwort zurückzusetzen. Der Link ist eine Stunde gültig.</p>`,
          cta: { label: "Neues Passwort festlegen", url },
          footerNote: "Wenn du das nicht warst, kannst du diese E-Mail ignorieren.",
        }),
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail(
        user.email,
        "Bitte bestätige deine E-Mail-Adresse – GebrauchtFelgen24",
        emailLayout({
          title: "Willkommen bei GebrauchtFelgen24!",
          bodyHtml: `<p>Hallo ${escapeHtml(user.name)},</p><p>schön, dass du da bist. Bitte bestätige deine E-Mail-Adresse, damit du Felgen inserieren und mit Verkäufern chatten kannst.</p>`,
          cta: { label: "E-Mail bestätigen", url },
        }),
      );
    },
  },
  socialProviders,
  account: { accountLinking: { enabled: true, trustedProviders: ["google", "apple"] } },
  user: {
    deleteUser: { enabled: true },
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "user" },
      accountType: { type: "string", input: true, defaultValue: "privat" },
      companyName: { type: "string", input: true, required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  databaseHooks: {
    user: {
      delete: {
        before: async (u) => {
          // Bilddateien des Nutzers merken und nach dem Löschen entfernen
          const imgs = await db.select({ key: schema.listingImage.key }).from(schema.listingImage).where(eq(schema.listingImage.userId, u.id));
          setTimeout(() => {
            for (const i of imgs) void deleteStoredImage(i.key);
          }, 5000);
        },
      },
      create: {
        before: async (u) => {
          const data: Record<string, unknown> = { ...u };
          if (data.accountType !== "haendler") {
            data.accountType = "privat";
            data.companyName = null;
          }
          if (env.adminEmail && u.email.toLowerCase() === env.adminEmail) data.role = "admin";
          return { data: data as typeof u };
        },
      },
    },
    session: {
      create: {
        before: async (s) => {
          const [u] = await db
            .select({ banned: schema.user.banned })
            .from(schema.user)
            .where(eq(schema.user.id, s.userId))
            .limit(1);
          if (u?.banned) return false;
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
