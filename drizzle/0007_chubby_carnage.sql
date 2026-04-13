ALTER TABLE "api_key" DROP CONSTRAINT "api_key_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "api_key" ALTER COLUMN "user_id" DROP NOT NULL;