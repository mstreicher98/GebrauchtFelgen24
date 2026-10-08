CREATE TYPE "public"."account_type" AS ENUM('privat', 'haendler');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('neu', 'neuwertig', 'gebraucht', 'beschaedigt');--> statement-breakpoint
CREATE TYPE "public"."listing_kind" AS ENUM('felge', 'komplettrad');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('aktiv', 'verkauft', 'deaktiviert', 'abgelaufen', 'gesperrt');--> statement-breakpoint
CREATE TYPE "public"."material" AS ENUM('alu', 'stahl', 'geschmiedet', 'carbon', 'magnesium', 'speiche');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('fest', 'vb');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('offen', 'erledigt');--> statement-breakpoint
CREATE TYPE "public"."report_target" AS ENUM('listing', 'user', 'message');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('sommer', 'winter', 'ganzjahr');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('auto', 'motorrad');--> statement-breakpoint
CREATE TYPE "public"."wheel_position" AS ENUM('alle', 'vorne', 'hinten');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block" (
	"blocker_id" text NOT NULL,
	"blocked_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "block_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" integer NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"buyer_last_read_at" timestamp with time zone,
	"seller_last_read_at" timestamp with time zone,
	"buyer_notified_at" timestamp with time zone,
	"seller_notified_at" timestamp with time zone,
	"buyer_archived" boolean DEFAULT false NOT NULL,
	"seller_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite" (
	"user_id" text NOT NULL,
	"listing_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_user_id_listing_id_pk" PRIMARY KEY("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "hsn_tsn" (
	"hsn" text NOT NULL,
	"tsn" text NOT NULL,
	"generation_id" integer NOT NULL,
	"description" text,
	CONSTRAINT "hsn_tsn_hsn_tsn_pk" PRIMARY KEY("hsn","tsn")
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "listing_status" DEFAULT 'aktiv' NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"kind" "listing_kind" NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"material" "material" NOT NULL,
	"rim_brand" text NOT NULL,
	"rim_model" text,
	"diameter" numeric(4, 1) NOT NULL,
	"width" numeric(4, 2) NOT NULL,
	"bolt_count" integer,
	"bolt_circle" numeric(5, 1),
	"et" integer,
	"center_bore" numeric(5, 1),
	"quantity" integer NOT NULL,
	"wheel_position" "wheel_position" DEFAULT 'alle' NOT NULL,
	"condition" "condition" NOT NULL,
	"has_certificate" boolean DEFAULT false NOT NULL,
	"tire_size" text,
	"tire_brand" text,
	"season" "season",
	"tread_depth" numeric(3, 1),
	"dot" text,
	"tpms" boolean,
	"price_cents" integer NOT NULL,
	"price_type" "price_type" DEFAULT 'vb' NOT NULL,
	"shipping" boolean DEFAULT false NOT NULL,
	"pickup" boolean DEFAULT true NOT NULL,
	"shipping_cost_cents" integer,
	"zip" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'AT' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"show_phone" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"expiry_reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sold_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "listing_fitment" (
	"listing_id" integer NOT NULL,
	"generation_id" integer NOT NULL,
	CONSTRAINT "listing_fitment_listing_id_generation_id_pk" PRIMARY KEY("listing_id","generation_id")
);
--> statement-breakpoint
CREATE TABLE "listing_image" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_image_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"image_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "postal_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"zip" text NOT NULL,
	"place" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" text,
	"target_type" "report_target" NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'offen' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saved_search" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"query" jsonb NOT NULL,
	"notify" boolean DEFAULT true NOT NULL,
	"last_checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"account_type" "account_type" DEFAULT 'privat' NOT NULL,
	"company_name" text,
	"company_uid" text,
	"company_website" text,
	"company_logo_key" text,
	"phone" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"zip" text,
	"city" text,
	"country" text DEFAULT 'AT',
	"bio" text,
	"banned" boolean DEFAULT false NOT NULL,
	"notify_email" boolean DEFAULT true NOT NULL,
	"notify_push" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_generation" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"name" text NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"bolt_count" integer,
	"bolt_circle" numeric(5, 1),
	"center_bore" numeric(5, 1),
	"thread" text,
	"fastener" text,
	"et_min" integer,
	"et_max" integer,
	"width_min" numeric(4, 2),
	"width_max" numeric(4, 2),
	"diameter_min" integer,
	"diameter_max" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "vehicle_make" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_model" (
	"id" serial PRIMARY KEY NOT NULL,
	"make_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_wheel_spec" (
	"id" serial PRIMARY KEY NOT NULL,
	"generation_id" integer NOT NULL,
	"position" "wheel_position" DEFAULT 'alle' NOT NULL,
	"diameter" numeric(4, 1) NOT NULL,
	"width" numeric(4, 2),
	"et" integer,
	"tire_size" text
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_blocker_id_user_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_blocked_id_user_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hsn_tsn" ADD CONSTRAINT "hsn_tsn_generation_id_vehicle_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."vehicle_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_fitment" ADD CONSTRAINT "listing_fitment_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_fitment" ADD CONSTRAINT "listing_fitment_generation_id_vehicle_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."vehicle_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_image" ADD CONSTRAINT "listing_image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_image" ADD CONSTRAINT "listing_image_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_generation" ADD CONSTRAINT "vehicle_generation_model_id_vehicle_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_model"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_model" ADD CONSTRAINT "vehicle_model_make_id_vehicle_make_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."vehicle_make"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_wheel_spec" ADD CONSTRAINT "vehicle_wheel_spec_generation_id_vehicle_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."vehicle_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_listing_buyer" ON "conversation" USING btree ("listing_id","buyer_id");--> statement-breakpoint
CREATE INDEX "conversation_buyer_idx" ON "conversation" USING btree ("buyer_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversation_seller_idx" ON "conversation" USING btree ("seller_id","last_message_at");--> statement-breakpoint
CREATE INDEX "listing_status_idx" ON "listing" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "listing_user_idx" ON "listing" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "listing_pcd_idx" ON "listing" USING btree ("bolt_count","bolt_circle","diameter");--> statement-breakpoint
CREATE INDEX "listing_search_idx" ON "listing" USING gin (to_tsvector('german', "title" || ' ' || "rim_brand" || ' ' || coalesce("rim_model", '')));--> statement-breakpoint
CREATE INDEX "listing_fitment_gen_idx" ON "listing_fitment" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "listing_image_listing_idx" ON "listing_image" USING btree ("listing_id","position");--> statement-breakpoint
CREATE INDEX "message_conversation_idx" ON "message" USING btree ("conversation_id","id");--> statement-breakpoint
CREATE INDEX "postal_code_zip_idx" ON "postal_code" USING btree ("country","zip");--> statement-breakpoint
CREATE INDEX "postal_code_zip_only_idx" ON "postal_code" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "push_subscription_user_idx" ON "push_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_search_user_idx" ON "saved_search" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vehicle_generation_model_idx" ON "vehicle_generation" USING btree ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_make_type_slug" ON "vehicle_make" USING btree ("type","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_model_make_slug" ON "vehicle_model" USING btree ("make_id","slug");--> statement-breakpoint
CREATE INDEX "vehicle_wheel_spec_gen_idx" ON "vehicle_wheel_spec" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");