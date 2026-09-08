import * as v from 'valibot';
import * as h from '$lib/schema/helpers';

// The `flow` resource is the user-facing standalone flow that points at a flow document.
// Named `flowResourceSchema` to avoid colliding with `flowSchema` (the flow definition of
// nodes and edges) exported from `$lib/schema/flow`.
export const flowResourceSchema = v.object({
	id: h.uuid,
	organizationId: h.uuid,
	teamId: v.nullable(h.uuid),
	name: v.string(),
	description: v.nullable(v.string()),
	flowDocumentId: h.uuid,
	createdAt: h.date,
	updatedAt: h.date,
	archivedAt: v.nullable(h.date),
	deletedAt: v.nullable(h.date)
});
export type FlowResourceSchema = v.InferOutput<typeof flowResourceSchema>;

// Default name for a freshly created flow resource ("New flow" button in the builder).
export const defaultFlowResourceName = 'New flow';

// Zero read schema: timestamps arrive from Zero as unix millis, not JS Dates.
export const readFlowResourceZero = v.object({
	...flowResourceSchema.entries,
	createdAt: h.unixTimestamp,
	updatedAt: h.unixTimestamp,
	archivedAt: v.nullable(h.unixTimestamp),
	deletedAt: v.nullable(h.unixTimestamp)
});
export type ReadFlowResourceZero = v.InferOutput<typeof readFlowResourceZero>;

export const createFlowResourceSchema = v.object({
	id: v.optional(h.uuid),
	organizationId: h.uuid,
	teamId: v.optional(flowResourceSchema.entries.teamId, null),
	name: v.optional(h.shortString, defaultFlowResourceName),
	description: v.optional(v.nullable(h.longStringEmpty), null),
	flowDocumentId: h.uuid
});
export type CreateFlowResourceSchema = v.InferOutput<typeof createFlowResourceSchema>;
export type CreateFlowResourceSchemaInput = v.InferInput<typeof createFlowResourceSchema>;

export const updateFlowResourceSchema = v.partial(
	v.object({
		teamId: v.optional(flowResourceSchema.entries.teamId, null),
		name: v.optional(h.shortString),
		description: v.optional(v.nullable(h.longStringEmpty)),
		archivedAt: v.optional(flowResourceSchema.entries.archivedAt),
		deletedAt: v.optional(flowResourceSchema.entries.deletedAt)
	})
);
export type UpdateFlowResourceSchema = v.InferOutput<typeof updateFlowResourceSchema>;
export type UpdateFlowResourceSchemaInput = v.InferInput<typeof updateFlowResourceSchema>;

// ---------------------------------------------------------------------------
// Zero mutator schemas ({ input, metadata }), mirroring the petition/event pattern.
// Creating a flow also creates its flow_document, so create metadata carries both
// pre-generated IDs (client-generated so optimistic writes stay consistent).
// ---------------------------------------------------------------------------

export const createFlowResourceMutatorMetadata = v.object({
	organizationId: h.uuid,
	flowId: h.uuid,
	flowDocumentId: h.uuid
});
export type CreateFlowResourceMutatorMetadata = v.InferOutput<
	typeof createFlowResourceMutatorMetadata
>;

export const flowResourceMutatorMetadata = v.object({
	organizationId: h.uuid,
	flowId: h.uuid
});
export type FlowResourceMutatorMetadata = v.InferOutput<typeof flowResourceMutatorMetadata>;

// Client-facing create input: name/description/team only; IDs live in metadata.
export const createFlowResourceZero = v.object({
	name: v.optional(h.shortString, defaultFlowResourceName),
	description: v.optional(v.nullable(h.longStringEmpty), null),
	teamId: v.optional(flowResourceSchema.entries.teamId, null)
});
export type CreateFlowResourceZero = v.InferOutput<typeof createFlowResourceZero>;

export const createFlowResourceZeroMutatorSchema = v.object({
	input: createFlowResourceZero,
	metadata: createFlowResourceMutatorMetadata
});
export type CreateFlowResourceZeroMutatorSchema = v.InferInput<
	typeof createFlowResourceZeroMutatorSchema
>;
export type CreateFlowResourceZeroMutatorSchemaOutput = v.InferOutput<
	typeof createFlowResourceZeroMutatorSchema
>;

export const updateFlowResourceZero = v.partial(
	v.object({
		name: h.shortString,
		description: v.nullable(h.longStringEmpty),
		teamId: flowResourceSchema.entries.teamId
	})
);
export type UpdateFlowResourceZero = v.InferOutput<typeof updateFlowResourceZero>;

export const updateFlowResourceZeroMutatorSchema = v.object({
	input: updateFlowResourceZero,
	metadata: flowResourceMutatorMetadata
});
export type UpdateFlowResourceZeroMutatorSchema = v.InferInput<
	typeof updateFlowResourceZeroMutatorSchema
>;
export type UpdateFlowResourceZeroMutatorSchemaOutput = v.InferOutput<
	typeof updateFlowResourceZeroMutatorSchema
>;

export const archiveFlowResourceMutatorSchema = v.object({
	metadata: flowResourceMutatorMetadata
});
export type ArchiveFlowResourceMutatorSchema = v.InferInput<
	typeof archiveFlowResourceMutatorSchema
>;

export const deleteFlowResourceMutatorSchema = v.object({
	metadata: flowResourceMutatorMetadata
});
export type DeleteFlowResourceMutatorSchema = v.InferInput<typeof deleteFlowResourceMutatorSchema>;
