CREATE TABLE "legal_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" text
);
--> statement-breakpoint
ALTER TABLE "legal_version" ADD CONSTRAINT "legal_version_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "legal_version_slug_idx" ON "legal_version" USING btree ("slug","id");