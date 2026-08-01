ALTER TABLE "flow_execution_step" ALTER COLUMN "output" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "flow_execution_step" ALTER COLUMN "error" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "flow_document_id_unique" ON "flow" USING btree ("flow_document_id") WHERE "flow"."deleted_at" is null;