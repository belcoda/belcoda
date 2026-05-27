ALTER TABLE "organization" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "billing_email" text;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_stripe_customer_id_unique" ON "organization"("stripe_customer_id") WHERE "stripe_customer_id" IS NOT NULL;