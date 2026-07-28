ALTER TABLE "member" ADD COLUMN "settings" jsonb;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "settings";