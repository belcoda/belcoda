import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';
import {
	createMutatorSchemaZero,
	updateMutatorSchemaZero,
	deleteMutatorSchemaZero
} from '$lib/schema/person-note';

export const createPersonNote = defineMutator(
	createMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personNote.insert({
			id: args.metadata.personNoteId,
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			note: args.input.note,
			userId: args.metadata.userId,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	}
);

export const updatePersonNote = defineMutator(
	updateMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personNote.update({
			id: args.metadata.personNoteId,
			note: args.input.note,
			updatedAt: new Date().getTime()
		});
	}
);

export const deletePersonNote = defineMutator(
	deleteMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personNote.update({
			id: args.metadata.personNoteId,
			deletedAt: new Date().getTime()
		});
	}
);
