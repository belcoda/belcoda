import { defineMutator } from '@rocicorp/zero';
import {
	createMutatorSchemaZero,
	updateMutatorSchemaZero,
	deleteMutatorSchemaZero
} from '$lib/schema/person-note';
import { builder } from '$lib/zero/schema';

export const createPersonNote = defineMutator(createMutatorSchemaZero, async ({ tx, args }) => {
	const now = Date.now();
	tx.mutate.personNote.insert({
		id: args.metadata.personNoteId,
		organizationId: args.metadata.organizationId,
		personId: args.metadata.personId,
		note: args.input.note,
		userId: args.metadata.userId,
		createdAt: now,
		updatedAt: now
	});
	for (const mention of args.input.mentions) {
		tx.mutate.personNoteMention.insert({
			...mention,
			personNoteId: args.metadata.personNoteId,
			createdAt: now
		});
	}
});

export const updatePersonNote = defineMutator(updateMutatorSchemaZero, async ({ tx, args }) => {
	const now = Date.now();
	tx.mutate.personNote.update({
		id: args.metadata.personNoteId,
		note: args.input.note,
		updatedAt: now
	});
	const existingMentions = await tx.run(
		builder.personNoteMention.where('personNoteId', '=', args.metadata.personNoteId)
	);
	for (const mention of existingMentions) {
		tx.mutate.personNoteMention.delete({ id: mention.id });
	}
	for (const mention of args.input.mentions) {
		tx.mutate.personNoteMention.insert({
			...mention,
			personNoteId: args.metadata.personNoteId,
			createdAt: now
		});
	}
});

export const deletePersonNote = defineMutator(
	deleteMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personNote.update({
			id: args.metadata.personNoteId,
			deletedAt: Date.now()
		});
	}
);
