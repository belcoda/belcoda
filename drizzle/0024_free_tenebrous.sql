CREATE TABLE "flow" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_id" uuid,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"flow_document_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "flow_document" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_id" uuid,
	"draft_flow_definition" jsonb DEFAULT '{"nodes":[],"edges":[]}'::jsonb NOT NULL,
	"draft_revision" integer DEFAULT 0 NOT NULL,
	"schema_version" text NOT NULL,
	"version_counter" integer DEFAULT 0 NOT NULL,
	"active_version_id" uuid,
	"execution_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"retired_at" timestamp with time zone,
	CONSTRAINT "flow_document_active_check" CHECK ("flow_document"."execution_enabled" = false OR "flow_document"."active_version_id" IS NOT NULL),
	CONSTRAINT "flow_document_retired_check" CHECK ("flow_document"."retired_at" IS NULL OR "flow_document"."execution_enabled" = false)
);
--> statement-breakpoint
CREATE TABLE "flow_execution" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"flow_document_id" uuid NOT NULL,
	"flow_version_id" uuid NOT NULL,
	"trigger_node_id" uuid NOT NULL,
	"source_reference_id" text,
	"idempotency_key" text NOT NULL,
	"person_id" uuid,
	"status" text NOT NULL,
	"input" jsonb NOT NULL,
	"error" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "flow_execution_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "flow_execution_step" (
	"id" uuid PRIMARY KEY NOT NULL,
	"execution_id" uuid NOT NULL,
	"step_node_id" uuid NOT NULL,
	"invocation_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" text NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"error" jsonb,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "flow_execution_step_unique" UNIQUE("execution_id","invocation_id","attempt_number")
);
--> statement-breakpoint
CREATE TABLE "flow_trigger_registration" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"flow_document_id" uuid NOT NULL,
	"flow_version_id" uuid NOT NULL,
	"trigger_node_id" uuid NOT NULL,
	"trigger_type" text NOT NULL,
	"reference_id" uuid,
	"configuration" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"next_run_at" timestamp with time zone,
	CONSTRAINT "flow_trigger_registration_unique" UNIQUE("flow_version_id","trigger_node_id")
);
--> statement-breakpoint
CREATE TABLE "flow_version" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"flow_document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"flow_definition" jsonb NOT NULL,
	"schema_version" text NOT NULL,
	"checksum" text NOT NULL,
	"published_by" uuid NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	CONSTRAINT "flow_version_unique" UNIQUE("flow_document_id","version_number")
);
--> statement-breakpoint
ALTER TABLE "flow" ADD CONSTRAINT "flow_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow" ADD CONSTRAINT "flow_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow" ADD CONSTRAINT "flow_flow_document_id_flow_document_id_fk" FOREIGN KEY ("flow_document_id") REFERENCES "public"."flow_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_document" ADD CONSTRAINT "flow_document_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_document" ADD CONSTRAINT "flow_document_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_document" ADD CONSTRAINT "flow_document_active_version_id_flow_version_id_fk" FOREIGN KEY ("active_version_id") REFERENCES "public"."flow_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_execution" ADD CONSTRAINT "flow_execution_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_execution" ADD CONSTRAINT "flow_execution_flow_document_id_flow_document_id_fk" FOREIGN KEY ("flow_document_id") REFERENCES "public"."flow_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_execution" ADD CONSTRAINT "flow_execution_flow_version_id_flow_version_id_fk" FOREIGN KEY ("flow_version_id") REFERENCES "public"."flow_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_execution" ADD CONSTRAINT "flow_execution_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_execution_step" ADD CONSTRAINT "flow_execution_step_execution_id_flow_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."flow_execution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_trigger_registration" ADD CONSTRAINT "flow_trigger_registration_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_trigger_registration" ADD CONSTRAINT "flow_trigger_registration_flow_document_id_flow_document_id_fk" FOREIGN KEY ("flow_document_id") REFERENCES "public"."flow_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_trigger_registration" ADD CONSTRAINT "flow_trigger_registration_flow_version_id_flow_version_id_fk" FOREIGN KEY ("flow_version_id") REFERENCES "public"."flow_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_version" ADD CONSTRAINT "flow_version_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_version" ADD CONSTRAINT "flow_version_flow_document_id_flow_document_id_fk" FOREIGN KEY ("flow_document_id") REFERENCES "public"."flow_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_version" ADD CONSTRAINT "flow_version_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "flow_document_id_unique" ON "flow" USING btree ("flow_document_id") WHERE "flow"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "flow_execution_document" ON "flow_execution" USING btree ("flow_document_id");--> statement-breakpoint
CREATE INDEX "flow_execution_version" ON "flow_execution" USING btree ("flow_version_id");--> statement-breakpoint
CREATE INDEX "flow_execution_organization" ON "flow_execution" USING btree ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "flow_execution_step_flow_execution_id_index" ON "flow_execution_step" USING btree ("status","scheduled_at") WHERE "flow_execution_step"."status" in ('scheduled', 'running');--> statement-breakpoint
CREATE INDEX "flow_trigger_registration_due_idx" ON "flow_trigger_registration" USING btree ("next_run_at") WHERE "flow_trigger_registration"."next_run_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "flow_trigger_reference_idx" ON "flow_trigger_registration" USING btree ("organization_id","trigger_type","reference_id");--> statement-breakpoint
CREATE INDEX "flow_trigger_registration_flow_document_index" ON "flow_trigger_registration" USING btree ("flow_document_id");