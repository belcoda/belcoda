import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { type MutatorParams } from '$lib/zero/schema';

import { personNote } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { personNoteReadPermissions } from '$lib/zero/query/person_note/permissions';

import { getQueryContext } from '$lib/server/api/utils/auth/permissions';

import {
	type CreateMutatorSchemaZero,
	type UpdateMutatorSchemaZero,
	type DeleteMutatorSchemaZero
} from '$lib/schema/person-note';

export function createPersonNote(params: MutatorParams) {
	return async function (tx: Transaction, args: CreateMutatorSchemaZero) {
		const personRecord = await tx.query.person
			.where('organizationId', '=', args.metadata.organizationId)
			.where('deletedAt', 'IS', null)
			.where('id', '=', args.metadata.personId)
			.where((expr) => personReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!personRecord) {
			throw new Error('Person not found');
		}

		const personNoteToCreate: typeof personNote.$inferInsert = {
			id: args.metadata.personNoteId,
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			note: args.input.note,
			userId: params.queryContext.userId,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const [result] = await tx.dbTransaction.wrappedTransaction
			.insert(personNote)
			.values(personNoteToCreate)
			.returning();
		if (!result) {
			throw new Error('Unable to create person note');
		}

		params.result?.push(result);
	};
}

export function updatePersonNote(params: MutatorParams) {
	return async function (tx: Transaction, args: UpdateMutatorSchemaZero) {
		const personNoteRecord = await tx.query.personNote
			.where('id', '=', args.metadata.personNoteId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => personNoteReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!personNoteRecord) {
			throw new Error('Person note not found');
		}

		const [result] = await tx.dbTransaction.wrappedTransaction
			.update(personNote)
			.set({
				note: args.input.note,
				updatedAt: new Date()
			})
			.where(eq(personNote.id, args.metadata.personNoteId))
			.returning();
		if (!result) {
			throw new Error('Unable to update person note');
		}

		params.result?.push(result);
	};
}

export function deletePersonNote(params: MutatorParams) {
	return async function (tx: Transaction, args: DeleteMutatorSchemaZero) {
		const personNoteRecord = await tx.query.personNote
			.where('id', '=', args.metadata.personNoteId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => personNoteReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!personNoteRecord) {
			throw new Error('Person note not found');
		}

		const [result] = await tx.dbTransaction.wrappedTransaction
			.update(personNote)
			.set({ deletedAt: new Date() })
			.where(eq(personNote.id, args.metadata.personNoteId))
			.returning();
		if (!result) {
			throw new Error('Unable to delete person note');
		}

		params.result?.push(result);
	};
}
