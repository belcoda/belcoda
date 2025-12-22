import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreateMutatorSchemaZero,
	type UpdateMutatorSchemaZero,
	type DeleteMutatorSchemaZero
} from '$lib/schema/person-note';

export function createPersonNote() {
	return async function (tx: Transaction<Schema>, args: CreateMutatorSchemaZero) {
		tx.mutate.personNote.insert({
			id: args.metadata.personNoteId,
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			note: args.input.note,
			userId: args.metadata.userId,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	};
}

export function updatePersonNote() {
	return async function (tx: Transaction<Schema>, args: UpdateMutatorSchemaZero) {
		tx.mutate.personNote.update({
			id: args.metadata.personNoteId,
			note: args.input.note,
			updatedAt: new Date().getTime()
		});
	};
}

export function deletePersonNote() {
	return async function (tx: Transaction<Schema>, args: DeleteMutatorSchemaZero) {
		tx.mutate.personNote.update({
			id: args.metadata.personNoteId,
			deletedAt: new Date().getTime()
		});
	};
}
