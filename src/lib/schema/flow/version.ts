import * as v from 'valibot';
import * as h from '$lib/schema/helpers';
import { flowSchema, schemaVersion } from '$lib/schema/flow';

// one row per successful publication of a flow document's draftDefinition.
// rows are immutable once published (APPEND ONLY), so there is no update schema.
export const flowVersionSchema = v.object({
	id: h.uuid,
	organizationId: h.uuid,
	flowDocumentId: h.uuid,
	versionNumber: h.integer,
	flowDefinition: flowSchema,
	schemaVersion: schemaVersion,
	checksum: v.string(),
	publishedBy: h.uuid,
	publishedAt: h.date
});
export type FlowVersionSchema = v.InferOutput<typeof flowVersionSchema>;

export const createFlowVersionSchema = v.object({
	id: v.optional(h.uuid),
	organizationId: h.uuid,
	flowDocumentId: h.uuid
});
export type CreateFlowVersionSchema = v.InferOutput<typeof createFlowVersionSchema>;
export type CreateFlowVersionSchemaInput = v.InferInput<typeof createFlowVersionSchema>;
