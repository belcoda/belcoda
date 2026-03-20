import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const tagSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	name: helpers.shortString,
	active: v.boolean(),
	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});

export type TagSchema = v.InferOutput<typeof tagSchema>;

export const readTagRest = v.object({
	id: tagSchema.entries.id,
	name: tagSchema.entries.name,
	active: tagSchema.entries.active,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});
export type ReadTagRest = v.InferOutput<typeof readTagRest>;

export const readTagZero = v.object({
	...tagSchema.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadTagZero = v.InferOutput<typeof readTagZero>;

export const createTag = v.object({
	name: tagSchema.entries.name
});
export type CreateTag = v.InferInput<typeof createTag>;

export const updateTag = v.partial(
	v.object({
		name: tagSchema.entries.name,
		active: tagSchema.entries.active
	})
);
export type UpdateTag = v.InferInput<typeof updateTag>;

export const mutatorMetadata = v.object({
	organizationId: helpers.uuid,
	tagId: helpers.uuid
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createTag,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateTag,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
