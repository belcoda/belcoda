import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const personImportStatus = v.picklist(['pending', 'processing', 'completed', 'failed']);
export type PersonImportStatus = v.InferOutput<typeof personImportStatus>;

export const personImportSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	csvUrl: helpers.url,
	status: personImportStatus,
	totalRows: helpers.integer,
	processedRows: helpers.integer,
	failedRows: helpers.integer,
	failedEntries: v.nullable(v.unknown()),
	importedBy: helpers.uuid,
	createdAt: helpers.date,
	completedAt: v.nullable(helpers.date)
});
export type PersonImportSchema = v.InferOutput<typeof personImportSchema>;

export const readPersonImportRest = v.object({
	...v.omit(personImportSchema, ['organizationId']).entries
});
export type ReadPersonImportRest = v.InferOutput<typeof readPersonImportRest>;

export const readPersonImportZero = v.object({
	...personImportSchema.entries,
	createdAt: helpers.dateToString,
	completedAt: v.nullable(helpers.dateToString)
});
export type ReadPersonImportZero = v.InferOutput<typeof readPersonImportZero>;

export const createPersonImport = v.object({
	csvUrl: helpers.url
});
export type CreatePersonImport = v.InferInput<typeof createPersonImport>;

export const mutatorMetadata = v.object({
	organizationId: personImportSchema.entries.organizationId,
	importId: personImportSchema.entries.id,
	importedBy: personImportSchema.entries.importedBy
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createPersonImport,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const createMutatorSchemaZero = v.object({
	input: createPersonImport,
	metadata: mutatorMetadata
});
export type CreateMutatorSchemaZeroInput = v.InferInput<typeof createMutatorSchemaZero>;
export type CreateMutatorSchemaZeroOutput = v.InferOutput<typeof createMutatorSchemaZero>;

export const triggerImportQueueMutatorSchema = v.object({
	metadata: mutatorMetadata
});
export type TriggerImportQueueMutatorSchema = v.InferInput<typeof triggerImportQueueMutatorSchema>;
export type TriggerImportQueueMutatorSchemaOutput = v.InferOutput<
	typeof triggerImportQueueMutatorSchema
>;
