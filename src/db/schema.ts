import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const vehicleTypeEnum = pgEnum("vehicle_type", ["auto", "motorrad"]);
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const accountTypeEnum = pgEnum("account_type", ["privat", "haendler"]);
export const listingStatusEnum = pgEnum("listing_status", [
  "aktiv",
  "verkauft",
  "deaktiviert",
  "abgelaufen",
  "gesperrt",
]);
export const listingKindEnum = pgEnum("listing_kind", ["felge", "komplettrad"]);
export const materialEnum = pgEnum("material", [
  "alu",
  "stahl",
  "geschmiedet",
  "carbon",
  "magnesium",
  "speiche",
]);
export const conditionEnum = pgEnum("condition", ["neu", "neuwertig", "gebraucht", "beschaedigt"]);
export const seasonEnum = pgEnum("season", ["sommer", "winter", "ganzjahr"]);
export const priceTypeEnum = pgEnum("price_type", ["fest", "vb"]);
export const wheelPositionEnum = pgEnum("wheel_position", ["alle", "vorne", "hinten"]);
export const reportStatusEnum = pgEnum("report_status", ["offen", "erledigt"]);
export const reportTargetEnum = pgEnum("report_target", ["listing", "user", "message"]);

/* ------------------------------------------------------------------ */
/* Auth (better-auth core tables + eigene Felder)                      */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // eigene Felder
  role: userRoleEnum("role").notNull().default("user"),
  accountType: accountTypeEnum("account_type").notNull().default("privat"),
  companyName: text("company_name"),
  companyUid: text("company_uid"),
  companyWebsite: text("company_website"),
  companyLogoKey: text("company_logo_key"),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  zip: text("zip"),
  city: text("city"),
  country: text("country").default("AT"),
  bio: text("bio"),
  banned: boolean("banned").notNull().default(false),
  notifyEmail: boolean("notify_email").notNull().default(true),
  notifyPush: boolean("notify_push").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ------------------------------------------------------------------ */
/* Fahrzeugdatenbank                                                   */
/* ------------------------------------------------------------------ */

export const vehicleMake = pgTable(
  "vehicle_make",
  {
    id: serial("id").primaryKey(),
    type: vehicleTypeEnum("type").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("vehicle_make_type_slug").on(t.type, t.slug)],
);

export const vehicleModel = pgTable(
  "vehicle_model",
  {
    id: serial("id").primaryKey(),
    makeId: integer("make_id")
      .notNull()
      .references(() => vehicleMake.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("vehicle_model_make_slug").on(t.makeId, t.slug)],
);

export const vehicleGeneration = pgTable(
  "vehicle_generation",
  {
    id: serial("id").primaryKey(),
    modelId: integer("model_id")
      .notNull()
      .references(() => vehicleModel.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    boltCount: integer("bolt_count"),
    boltCircle: numeric("bolt_circle", { precision: 5, scale: 1, mode: "number" }),
    centerBore: numeric("center_bore", { precision: 5, scale: 1, mode: "number" }),
    thread: text("thread"),
    fastener: text("fastener"),
    etMin: integer("et_min"),
    etMax: integer("et_max"),
    widthMin: numeric("width_min", { precision: 4, scale: 2, mode: "number" }),
    widthMax: numeric("width_max", { precision: 4, scale: 2, mode: "number" }),
    diameterMin: integer("diameter_min"),
    diameterMax: integer("diameter_max"),
    notes: text("notes"),
  },
  (t) => [index("vehicle_generation_model_idx").on(t.modelId)],
);

export const vehicleWheelSpec = pgTable(
  "vehicle_wheel_spec",
  {
    id: serial("id").primaryKey(),
    generationId: integer("generation_id")
      .notNull()
      .references(() => vehicleGeneration.id, { onDelete: "cascade" }),
    position: wheelPositionEnum("position").notNull().default("alle"),
    diameter: numeric("diameter", { precision: 4, scale: 1, mode: "number" }).notNull(),
    width: numeric("width", { precision: 4, scale: 2, mode: "number" }),
    et: integer("et"),
    tireSize: text("tire_size"),
  },
  (t) => [index("vehicle_wheel_spec_gen_idx").on(t.generationId)],
);

export const hsnTsn = pgTable(
  "hsn_tsn",
  {
    hsn: text("hsn").notNull(),
    tsn: text("tsn").notNull(),
    generationId: integer("generation_id")
      .notNull()
      .references(() => vehicleGeneration.id, { onDelete: "cascade" }),
    description: text("description"),
  },
  (t) => [primaryKey({ columns: [t.hsn, t.tsn] })],
);

export const postalCode = pgTable(
  "postal_code",
  {
    id: serial("id").primaryKey(),
    country: text("country").notNull(),
    zip: text("zip").notNull(),
    place: text("place").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
  },
  (t) => [index("postal_code_zip_idx").on(t.country, t.zip), index("postal_code_zip_only_idx").on(t.zip)],
);

/* ------------------------------------------------------------------ */
/* Inserate                                                            */
/* ------------------------------------------------------------------ */

export const listing = pgTable(
  "listing",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: listingStatusEnum("status").notNull().default("aktiv"),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
    kind: listingKindEnum("kind").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    material: materialEnum("material").notNull(),
    rimBrand: text("rim_brand").notNull(),
    rimModel: text("rim_model"),
    diameter: numeric("diameter", { precision: 4, scale: 1, mode: "number" }).notNull(),
    width: numeric("width", { precision: 4, scale: 2, mode: "number" }).notNull(),
    boltCount: integer("bolt_count"),
    boltCircle: numeric("bolt_circle", { precision: 5, scale: 1, mode: "number" }),
    et: integer("et"),
    centerBore: numeric("center_bore", { precision: 5, scale: 1, mode: "number" }),
    quantity: integer("quantity").notNull(),
    wheelPosition: wheelPositionEnum("wheel_position").notNull().default("alle"),
    condition: conditionEnum("condition").notNull(),
    hasCertificate: boolean("has_certificate").notNull().default(false),
    // Komplettrad
    tireSize: text("tire_size"),
    tireBrand: text("tire_brand"),
    season: seasonEnum("season"),
    treadDepth: numeric("tread_depth", { precision: 3, scale: 1, mode: "number" }),
    dot: text("dot"),
    tpms: boolean("tpms"),
    // Preis & Übergabe
    priceCents: integer("price_cents").notNull(),
    priceType: priceTypeEnum("price_type").notNull().default("vb"),
    shipping: boolean("shipping").notNull().default(false),
    pickup: boolean("pickup").notNull().default(true),
    shippingCostCents: integer("shipping_cost_cents"),
    zip: text("zip").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull().default("AT"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    showPhone: boolean("show_phone").notNull().default(false),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    viewCount: integer("view_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    expiryReminderSentAt: timestamp("expiry_reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    soldAt: timestamp("sold_at", { withTimezone: true }),
  },
  (t) => [
    index("listing_status_idx").on(t.status, t.publishedAt),
    index("listing_user_idx").on(t.userId),
    index("listing_pcd_idx").on(t.boltCount, t.boltCircle, t.diameter),
    index("listing_search_idx").using(
      "gin",
      sql`to_tsvector('german', ${t.title} || ' ' || ${t.rimBrand} || ' ' || coalesce(${t.rimModel}, ''))`,
    ),
  ],
);

export const listingImage = pgTable(
  "listing_image",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: integer("listing_id").references(() => listing.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("listing_image_listing_idx").on(t.listingId, t.position)],
);

/** „Passend für" – Fahrzeuge, für die eine Felge laut Verkäufer passt (bei Motorrädern Pflicht). */
export const listingFitment = pgTable(
  "listing_fitment",
  {
    listingId: integer("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    generationId: integer("generation_id")
      .notNull()
      .references(() => vehicleGeneration.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.listingId, t.generationId] }), index("listing_fitment_gen_idx").on(t.generationId)],
);

export const favorite = pgTable(
  "favorite",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.listingId] })],
);

export const savedSearch = pgTable(
  "saved_search",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    query: jsonb("query").$type<Record<string, string>>().notNull(),
    notify: boolean("notify").notNull().default(true),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("saved_search_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export const conversation = pgTable(
  "conversation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sellerId: text("seller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    buyerLastReadAt: timestamp("buyer_last_read_at", { withTimezone: true }),
    sellerLastReadAt: timestamp("seller_last_read_at", { withTimezone: true }),
    buyerNotifiedAt: timestamp("buyer_notified_at", { withTimezone: true }),
    sellerNotifiedAt: timestamp("seller_notified_at", { withTimezone: true }),
    buyerArchived: boolean("buyer_archived").notNull().default(false),
    sellerArchived: boolean("seller_archived").notNull().default(false),
  },
  (t) => [
    uniqueIndex("conversation_listing_buyer").on(t.listingId, t.buyerId),
    index("conversation_buyer_idx").on(t.buyerId, t.lastMessageAt),
    index("conversation_seller_idx").on(t.sellerId, t.lastMessageAt),
  ],
);

export const message = pgTable(
  "message",
  {
    id: serial("id").primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull().default(""),
    imageKey: text("image_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("message_conversation_idx").on(t.conversationId, t.id)],
);

export const block = pgTable(
  "block",
  {
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

export const report = pgTable("report", {
  id: serial("id").primaryKey(),
  reporterId: text("reporter_id").references(() => user.id, { onDelete: "set null" }),
  targetType: reportTargetEnum("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: reportStatusEnum("status").notNull().default("offen"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  handledAt: timestamp("handled_at", { withTimezone: true }),
});

export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("push_subscription_user_idx").on(t.userId)],
);

export const appSetting = pgTable("app_setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const vehicleMakeRelations = relations(vehicleMake, ({ many }) => ({ models: many(vehicleModel) }));
export const vehicleModelRelations = relations(vehicleModel, ({ one, many }) => ({
  make: one(vehicleMake, { fields: [vehicleModel.makeId], references: [vehicleMake.id] }),
  generations: many(vehicleGeneration),
}));
export const vehicleGenerationRelations = relations(vehicleGeneration, ({ one, many }) => ({
  model: one(vehicleModel, { fields: [vehicleGeneration.modelId], references: [vehicleModel.id] }),
  specs: many(vehicleWheelSpec),
}));
export const vehicleWheelSpecRelations = relations(vehicleWheelSpec, ({ one }) => ({
  generation: one(vehicleGeneration, { fields: [vehicleWheelSpec.generationId], references: [vehicleGeneration.id] }),
}));
export const listingRelations = relations(listing, ({ one, many }) => ({
  user: one(user, { fields: [listing.userId], references: [user.id] }),
  images: many(listingImage),
  fitments: many(listingFitment),
}));
export const listingImageRelations = relations(listingImage, ({ one }) => ({
  listing: one(listing, { fields: [listingImage.listingId], references: [listing.id] }),
}));
export const listingFitmentRelations = relations(listingFitment, ({ one }) => ({
  listing: one(listing, { fields: [listingFitment.listingId], references: [listing.id] }),
  generation: one(vehicleGeneration, { fields: [listingFitment.generationId], references: [vehicleGeneration.id] }),
}));

export type User = typeof user.$inferSelect;
export type Listing = typeof listing.$inferSelect;
export type VehicleGeneration = typeof vehicleGeneration.$inferSelect;
export type VehicleWheelSpec = typeof vehicleWheelSpec.$inferSelect;
