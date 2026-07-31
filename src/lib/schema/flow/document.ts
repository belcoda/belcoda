import * as v from 'valibot';
import * as h from '$lib/schema/helpers';
import { schemaVersion, schemaVersionOptions } from '$lib/schema/flow';
import { flowSchema } from '$lib/schema/flow/node';

export const flowDocumentSchema = v.object({
	id: h.uuid,
	organizationId: h.uuid,
	teamId: v.nullable(h.uuid),
	draftFlowDefinition: flowSchema,
	draftRevision: h.integer,
	schemaVersion: schemaVersion,
	versionCounter: h.integer,
	activeVersionId: v.nullable(h.uuid),
	executionEnabled: v.boolean(),
	createdAt: h.date,
	updatedAt: h.date,
	deletedAt: v.nullable(h.date),
	retiredAt: v.nullable(h.date)
});
export type FlowDocumentSchema = v.InferOutput<typeof flowDocumentSchema>;

export const createFlowDocumentSchema = v.object({
	id: v.optional(h.uuid),
	organizationId: h.uuid,
	teamId: v.optional(flowDocumentSchema.entries.teamId, null),
	draftFlowDefinition: flowSchema,
	draftRevision: v.optional(h.integer, 0),
	schemaVersion: v.optional(schemaVersion, schemaVersionOptions[schemaVersionOptions.length - 1]),
	versionCounter: v.optional(h.integer, 0),
	executionEnabled: v.optional(v.boolean(), false)
});
export type CreateFlowDocumentSchema = v.InferOutput<typeof createFlowDocumentSchema>;
export type CreateFlowDocumentSchemaInput = v.InferInput<typeof createFlowDocumentSchema>;

export const updateFlowDocumentSchema = v.partial(
	v.object({
		teamId: v.optional(flowDocumentSchema.entries.teamId, null),
		draftFlowDefinition: v.optional(flowSchema),
		executionEnabled: v.optional(v.boolean()),
		activeVersionId: v.optional(flowDocumentSchema.entries.activeVersionId),
		retiredAt: v.optional(flowDocumentSchema.entries.retiredAt)
	})
);
export type UpdateFlowDocumentSchema = v.InferOutput<typeof updateFlowDocumentSchema>;
export type UpdateFlowDocumentSchemaInput = v.InferInput<typeof updateFlowDocumentSchema>;
