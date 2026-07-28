import * as v from 'valibot';
import * as h from '$lib/schema/helpers';
import {
	flowExecutionStepStatus,
	flowExecutionStepInputSchema,
	flowExecutionStepOutputSchema,
	flowExecutionStepErrorSchema
} from '$lib/schema/flow';

export const flowExecutionStepSchema = v.object({
	id: h.uuid,
	flowExecutionId: h.uuid,
	nodeId: h.uuid,
	invocationId: h.uuid,
	attemptNumber: h.integer,
	status: flowExecutionStepStatus,
	input: flowExecutionStepInputSchema,
	output: flowExecutionStepOutputSchema,
	error: flowExecutionStepErrorSchema,
	scheduledAt: v.nullable(h.date),
	createdAt: h.date,
	startedAt: v.nullable(h.date),
	completedAt: v.nullable(h.date)
});
export type FlowExecutionStepSchema = v.InferOutput<typeof flowExecutionStepSchema>;

export const createFlowExecutionStepSchema = v.object({
	id: v.optional(h.uuid),
	flowExecutionId: h.uuid,
	nodeId: h.uuid,
	invocationId: h.uuid,
	attemptNumber: v.optional(h.integer, 1),
	status: flowExecutionStepStatus,
	input: flowExecutionStepInputSchema,
	output: flowExecutionStepOutputSchema,
	error: flowExecutionStepErrorSchema,
	scheduledAt: v.optional(flowExecutionStepSchema.entries.scheduledAt, null),
	startedAt: v.optional(flowExecutionStepSchema.entries.startedAt, null)
});
export type CreateFlowExecutionStepSchema = v.InferOutput<typeof createFlowExecutionStepSchema>;
export type CreateFlowExecutionStepSchemaInput = v.InferInput<typeof createFlowExecutionStepSchema>;

export const updateFlowExecutionStepSchema = v.partial(
	v.object({
		status: v.optional(flowExecutionStepStatus),
		output: v.optional(flowExecutionStepOutputSchema),
		error: v.optional(flowExecutionStepErrorSchema),
		scheduledAt: v.optional(flowExecutionStepSchema.entries.scheduledAt),
		completedAt: v.optional(flowExecutionStepSchema.entries.completedAt)
	})
);
export type UpdateFlowExecutionStepSchema = v.InferOutput<typeof updateFlowExecutionStepSchema>;
export type UpdateFlowExecutionStepSchemaInput = v.InferInput<typeof updateFlowExecutionStepSchema>;
