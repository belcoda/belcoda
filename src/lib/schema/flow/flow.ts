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
	description: v.string(),
	flowDocumentId: h.uuid,
	createdAt: h.date,
	updatedAt: h.date,
	archivedAt: v.nullable(h.date),
	deletedAt: v.nullable(h.date)
});
export type FlowResourceSchema = v.InferOutput<typeof flowResourceSchema>;

export const createFlowResourceSchema = v.object({
	id: v.optional(h.uuid),
	organizationId: h.uuid,
	teamId: v.optional(flowResourceSchema.entries.teamId, null),
	name: h.shortString,
	description: h.longStringEmpty,
	flowDocumentId: h.uuid
});
export type CreateFlowResourceSchema = v.InferOutput<typeof createFlowResourceSchema>;
export type CreateFlowResourceSchemaInput = v.InferInput<typeof createFlowResourceSchema>;

export const updateFlowResourceSchema = v.partial(
	v.object({
		teamId: v.optional(flowResourceSchema.entries.teamId, null),
		name: v.optional(h.shortString),
		description: v.optional(h.longStringEmpty),
		archivedAt: v.optional(flowResourceSchema.entries.archivedAt),
		deletedAt: v.optional(flowResourceSchema.entries.deletedAt)
	})
);
export type UpdateFlowResourceSchema = v.InferOutput<typeof updateFlowResourceSchema>;
export type UpdateFlowResourceSchemaInput = v.InferInput<typeof updateFlowResourceSchema>;
