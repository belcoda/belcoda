CREATE TABLE "ledger" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"delta_in_usd_hundreths_of_cents" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ledger_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "free_whatsapp_message_credits" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "free_email_message_credits" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;