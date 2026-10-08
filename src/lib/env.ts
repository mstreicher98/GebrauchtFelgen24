export const env = {
  appUrl: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  appName: "GebrauchtFelgen24",
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  adminEmail: process.env.ADMIN_EMAIL?.toLowerCase().trim() || undefined,
  smtp: {
    host: process.env.SMTP_HOST || undefined,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS,
    secure: process.env.SMTP_SECURE === "true",
    from: process.env.SMTP_FROM || "GebrauchtFelgen24 <noreply@gebrauchtfelgen24.at>",
  },
  google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    bundleId: process.env.APPLE_APP_BUNDLE_IDENTIFIER || undefined,
  },
  listingLifetimeDays: Number(process.env.LISTING_LIFETIME_DAYS) || 60,
  seedDemo: process.env.SEED_DEMO === "true",
};

export const oauthEnabled = {
  google: Boolean(env.google.clientId && env.google.clientSecret),
  apple: Boolean(env.apple.clientId && env.apple.clientSecret),
};
