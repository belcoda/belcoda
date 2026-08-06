import * as v from 'valibot';
import * as h from '$lib/schema/helpers';
import {
	flowExecutionStatus,
	flowExecutionInputSchema,
	flowExecutionErrorSchema
} from '$lib/schema/flow';

export const flowExecutionSchema = v.object({
	id: h.uuid,
	organizationId: h.uuid,
	flowDocumentId: h.uuid,
	flowVersionId: h.uuid,
	triggerNodeId: h.uuid,
	sourceReferenceId: v.nullable(v.string()),
	idempotencyKey: v.string(),
	personId: v.nullable(h.uuid),
	status: flowExecutionStatus,
	input: flowExecutionInputSchema,
	error: flowExecutionErrorSchema,
	createdAt: h.date,
	startedAt: h.date,
	completedAt: v.nullable(h.date)
});
export type FlowExecutionSchema = v.InferOutput<typeof flowExecutionSchema>;

export const createFlowExecutionSchema = v.object({
	id: v.optional(h.uuid),
	organizationId: h.uuid,
	flowDocumentId: h.uuid,
	flowVersionId: h.uuid,
	triggerNodeId: h.uuid,
	sourceReferenceId: v.optional(flowExecutionSchema.entries.sourceReferenceId, null),
	idempotencyKey: v.string(),
	personId: v.optional(flowExecutionSchema.entries.personId, null),
	status: flowExecutionStatus,
	input: flowExecutionInputSchema,
	error: flowExecutionErrorSchema,
	startedAt: h.date,
	completedAt: v.optional(flowExecutionSchema.entries.completedAt, null)
});
export type CreateFlowExecutionSchema = v.InferOutput<typeof createFlowExecutionSchema>;
export type CreateFlowExecutionSchemaInput = v.InferInput<typeof createFlowExecutionSchema>;

export const updateFlowExecutionSchema = v.partial(
	v.object({
		status: v.optional(flowExecutionStatus),
		error: v.optional(flowExecutionErrorSchema),
		startedAt: v.optional(h.date),
		completedAt: v.optional(flowExecutionSchema.entries.completedAt)
	})
);
export type UpdateFlowExecutionSchema = v.InferOutput<typeof updateFlowExecutionSchema>;
export type UpdateFlowExecutionSchemaInput = v.InferInput<typeof updateFlowExecutionSchema>;
