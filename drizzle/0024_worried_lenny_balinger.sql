ALTER TABLE "flow_execution_step" ALTER COLUMN "attempt_number" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "flow_execution" ADD COLUMN "started_at" timestamp with time zone NOT NULL;