CREATE TABLE "member_favourite" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_favourite" ADD CONSTRAINT "member_favourite_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_favourite" ADD CONSTRAINT "member_favourite_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_favourite_member_reference_unique" ON "member_favourite" USING btree ("member_id","reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "member_favourite_organization_reference" ON "member_favourite" USING btree ("organization_id","reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "member_favourite_member_type_created_at" ON "member_favourite" USING btree ("member_id","reference_type","created_at" DESC NULLS LAST);