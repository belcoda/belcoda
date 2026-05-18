CREATE TABLE "person_whatsapp_identity" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"waba_id" text NOT NULL,
	"bsuid" text NOT NULL,
	"parent_user_id" text,
	"wa_phone" text,
	"display_name" text,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "person_whatsapp_identity" ADD CONSTRAINT "person_whatsapp_identity_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_whatsapp_identity" ADD CONSTRAINT "person_whatsapp_identity_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "person_whatsapp_identity_active_unique" ON "person_whatsapp_identity" USING btree ("organization_id","waba_id","bsuid") WHERE "person_whatsapp_identity"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "person_whatsapp_identity_person_id" ON "person_whatsapp_identity" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_whatsapp_identity_org_waba" ON "person_whatsapp_identity" USING btree ("organization_id","waba_id");