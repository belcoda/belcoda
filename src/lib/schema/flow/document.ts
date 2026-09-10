import * as v from 'valibot';
import * as h from '$lib/schema/helpers';
import { schemaVersion, schemaVersionOptions } from '$lib/schema/flow';
import { flowSchema } from '$lib/schema/flow/node';

// Shared between the server (thrown FlowDraftRevisionConflictError) and the client editor store,
// which matches on it to trigger the reject-and-reload path. Kept here so the client never imports
// from $lib/server.
export const FLOW_DRAFT_REVISION_CONFLICT_MESSAGE =
	'This flow was changed elsewhere. Reload to get the latest version.';

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
		teamId: v.optional(flowDocumentSchema.entries.teamId),
		draftFlowDefinition: v.optional(flowSchema),
		executionEnabled: v.optional(v.boolean()),
		activeVersionId: v.optional(flowDocumentSchema.entries.activeVersionId),
		retiredAt: v.optional(flowDocumentSchema.entries.retiredAt)
	})
);
export type UpdateFlowDocumentSchema = v.InferOutput<typeof updateFlowDocumentSchema>;
export type UpdateFlowDocumentSchemaInput = v.InferInput<typeof updateFlowDocumentSchema>;

// ---------------------------------------------------------------------------
// Zero schemas
// ---------------------------------------------------------------------------

// Zero read schema: timestamps arrive from Zero as unix millis, not JS Dates.
export const readFlowDocumentZero = v.object({
	...flowDocumentSchema.entries,
	createdAt: h.unixTimestamp,
	updatedAt: h.unixTimestamp,
	deletedAt: v.nullable(h.unixTimestamp),
	retiredAt: v.nullable(h.unixTimestamp)
});
export type ReadFlowDocumentZero = v.InferOutput<typeof readFlowDocumentZero>;

export const flowDocumentMutatorMetadata = v.object({
	organizationId: h.uuid,
	flowDocumentId: h.uuid
});
export type FlowDocumentMutatorMetadata = v.InferOutput<typeof flowDocumentMutatorMetadata>;

// Draft save: the editor sends the whole graph plus the revision it started from, so the server
// can compare-and-swap on draftRevision (reject + reload if someone else saved in the meantime).
export const updateFlowDocumentDraftZero = v.object({
	draftFlowDefinition: flowSchema,
	expectedDraftRevision: h.integer
});
export type UpdateFlowDocumentDraftZero = v.InferOutput<typeof updateFlowDocumentDraftZero>;

export const updateFlowDocumentDraftZeroMutatorSchema = v.object({
	input: updateFlowDocumentDraftZero,
	metadata: flowDocumentMutatorMetadata
});
export type UpdateFlowDocumentDraftZeroMutatorSchema = v.InferInput<
	typeof updateFlowDocumentDraftZeroMutatorSchema
>;
export type UpdateFlowDocumentDraftZeroMutatorSchemaOutput = v.InferOutput<
	typeof updateFlowDocumentDraftZeroMutatorSchema
>;

// Publish: the new flow_version id is generated client-side and carried in metadata so the
// optimistic flow_document update (activeVersionId/executionEnabled) matches what the server writes.
export const publishFlowDocumentMutatorMetadata = v.object({
	organizationId: h.uuid,
	flowDocumentId: h.uuid,
	flowVersionId: h.uuid
});
export type PublishFlowDocumentMutatorMetadata = v.InferOutput<
	typeof publishFlowDocumentMutatorMetadata
>;

export const publishFlowDocumentZeroMutatorSchema = v.object({
	metadata: publishFlowDocumentMutatorMetadata
});
export type PublishFlowDocumentZeroMutatorSchema = v.InferInput<
	typeof publishFlowDocumentZeroMutatorSchema
>;
export type PublishFlowDocumentZeroMutatorSchemaOutput = v.InferOutput<
	typeof publishFlowDocumentZeroMutatorSchema
>;

// Rollback: repoint activeVersionId at an existing (already-published) flow_version.
export const rollbackFlowDocumentZero = v.object({
	flowVersionId: h.uuid
});
export type RollbackFlowDocumentZero = v.InferOutput<typeof rollbackFlowDocumentZero>;

export const rollbackFlowDocumentZeroMutatorSchema = v.object({
	input: rollbackFlowDocumentZero,
	metadata: flowDocumentMutatorMetadata
});
export type RollbackFlowDocumentZeroMutatorSchema = v.InferInput<
	typeof rollbackFlowDocumentZeroMutatorSchema
>;
export type RollbackFlowDocumentZeroMutatorSchemaOutput = v.InferOutput<
	typeof rollbackFlowDocumentZeroMutatorSchema
>;
