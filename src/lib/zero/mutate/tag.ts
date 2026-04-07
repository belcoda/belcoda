import { defineMutator } from '@rocicorp/zero';
import { createMutatorSchema, updateMutatorSchema, deleteMutatorSchema } from '$lib/schema/tag';

export const createTag = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.tag.insert({
		id: args.metadata.tagId,
		organizationId: args.metadata.organizationId,
		name: args.input.name,
		active: true,
		createdAt: Date.now(),
		updatedAt: Date.now()
	});
});

export const updateTag = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.tag.update({
		id: args.metadata.tagId,
		name: args.input.name,
		active: args.input.active,
		updatedAt: Date.now()
	});
});

export const deleteTag = defineMutator(deleteMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.tag.update({
		id: args.metadata.tagId,
		deletedAt: Date.now()
	});
});
