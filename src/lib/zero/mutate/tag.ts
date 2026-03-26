import { defineMutator } from '@rocicorp/zero';
import { createMutatorSchema, updateMutatorSchema, deleteMutatorSchema } from '$lib/schema/tag';

export const createTag = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.tag.insert({
		id: args.metadata.tagId,
		organizationId: args.metadata.organizationId,
		name: args.input.name,
		active: true,
		createdAt: new Date().getTime(),
		updatedAt: new Date().getTime()
	});
});

export const updateTag = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.tag.update({
		id: args.metadata.tagId,
		name: args.input.name,
		active: args.input.active,
		updatedAt: new Date().getTime()
	});
});

export const deleteTag = defineMutator(deleteMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.tag.update({
		id: args.metadata.tagId,
		deletedAt: new Date().getTime()
	});
});
