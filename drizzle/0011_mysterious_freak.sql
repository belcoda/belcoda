ALTER TABLE "organization" ALTER COLUMN "free_whatsapp_message_credits" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "free_email_message_credits" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "reset_free_quotas_after" timestamp with time zone;