ALTER TABLE "person_whatsapp_identity" ALTER COLUMN "waba_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "person_whatsapp_identity" ALTER COLUMN "bsuid" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "person_whatsapp_identity" ADD COLUMN "whatsapp_account_id" uuid;--> statement-breakpoint
ALTER TABLE "person_whatsapp_identity" ADD COLUMN "jid" text;--> statement-breakpoint
ALTER TABLE "person_whatsapp_identity" ADD CONSTRAINT "person_whatsapp_identity_whatsapp_account_id_whatsapp_account_id_fk" FOREIGN KEY ("whatsapp_account_id") REFERENCES "public"."whatsapp_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "person_whatsapp_identity_linked_device_active_unique" ON "person_whatsapp_identity" USING btree ("organization_id","whatsapp_account_id","jid") WHERE "person_whatsapp_identity"."deleted_at" is null;