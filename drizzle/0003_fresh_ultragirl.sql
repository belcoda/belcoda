ALTER TABLE "whatsapp_send_queue" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "whatsapp_send_queue" CASCADE;--> statement-breakpoint
ALTER TABLE "whatsapp_thread" DROP CONSTRAINT "whatsapp_thread_templateId_whatsapp_template_id_fk";
--> statement-breakpoint
ALTER TABLE "whatsapp_message" ALTER COLUMN "person_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD COLUMN "status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD COLUMN "status_message" text;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "whatsapp_thread" ADD COLUMN "flow" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_thread" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "whatsapp_thread" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "whatsapp_thread" DROP COLUMN "recipients";--> statement-breakpoint
ALTER TABLE "whatsapp_thread" DROP COLUMN "templateId";--> statement-breakpoint
ALTER TABLE "whatsapp_thread" DROP COLUMN "template_message";--> statement-breakpoint
ALTER TABLE "whatsapp_thread" DROP COLUMN "messages";--> statement-breakpoint
ALTER TABLE "whatsapp_thread" DROP COLUMN "actions";