ALTER TYPE "public"."listing_kind" ADD VALUE 'reifen';--> statement-breakpoint
DROP INDEX "listing_search_idx";--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "material" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "rim_brand" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "width" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "tire_size_norm" text;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "tire_model" text;--> statement-breakpoint
CREATE INDEX "listing_tire_idx" ON "listing" USING btree ("tire_size_norm");--> statement-breakpoint
CREATE INDEX "listing_search_idx" ON "listing" USING gin (to_tsvector('german', "title" || ' ' || coalesce("rim_brand", '') || ' ' || coalesce("rim_model", '') || ' ' || coalesce("tire_brand", '') || ' ' || coalesce("tire_model", '')));