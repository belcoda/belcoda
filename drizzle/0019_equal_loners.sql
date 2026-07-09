CREATE TABLE "whatsapp_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reference_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"identifier" text NOT NULL,
	"details" jsonb NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "whatsapp_account_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE INDEX "whatsapp_account_reference_idx" ON "whatsapp_account" USING btree ("reference_id");