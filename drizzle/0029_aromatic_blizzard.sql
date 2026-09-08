CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location" geography(Point,4326);--> statement-breakpoint
CREATE INDEX "event_location_gist" ON "event" USING gist ("location");