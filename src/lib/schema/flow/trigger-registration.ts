import * as v from 'valibot';
import * as h from '$lib/schema/helpers';
import { triggerType, flowTriggerConfigurationSchema } from '$lib/schema/flow';

export const flowTriggerRegistrationSchema = v.object({
	id: h.uuid,
	organizationId: h.uuid,
	flowDocumentId: h.uuid,
	flowVersionId: h.uuid,
	triggerNodeId: h.uuid,
	triggerType: triggerType,
	referenceId: v.nullable(h.uuid),
	configuration: flowTriggerConfigurationSchema,
	createdAt: h.date,
	updatedAt: h.date,
	nextRunAt: v.nullable(h.date)
});
export type FlowTriggerRegistrationSchema = v.InferOutput<typeof flowTriggerRegistrationSchema>;

export const createFlowTriggerRegistrationSchema = v.object({
	triggerNodeId: h.uuid,
	triggerType: triggerType,
	referenceId: v.optional(flowTriggerRegistrationSchema.entries.referenceId, null),
	configuration: flowTriggerConfigurationSchema,
	nextRunAt: v.optional(flowTriggerRegistrationSchema.entries.nextRunAt, null)
});
export type CreateFlowTriggerRegistrationSchema = v.InferOutput<
	typeof createFlowTriggerRegistrationSchema
>;
export type CreateFlowTriggerRegistrationSchemaInput = v.InferInput<
	typeof createFlowTriggerRegistrationSchema
>;

export const updateFlowTriggerRegistrationSchema = v.partial(
	v.object({
		configuration: v.optional(flowTriggerConfigurationSchema),
		nextRunAt: v.optional(flowTriggerRegistrationSchema.entries.nextRunAt)
	})
);
export type UpdateFlowTriggerRegistrationSchema = v.InferOutput<
	typeof updateFlowTriggerRegistrationSchema
>;
export type UpdateFlowTriggerRegistrationSchemaInput = v.InferInput<
	typeof updateFlowTriggerRegistrationSchema
>;
