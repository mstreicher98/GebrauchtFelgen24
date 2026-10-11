ALTER TYPE "public"."report_target" ADD VALUE 'conversation';--> statement-breakpoint
CREATE TABLE "admin_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "handled_by_id" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "resolution" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "admin_log" ADD CONSTRAINT "admin_log_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_log_created_idx" ON "admin_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_log_target_idx" ON "admin_log" USING btree ("target_type","target_id");--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_handled_by_id_user_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;