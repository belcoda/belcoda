import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';

import { personNote } from '$lib/schema/drizzle';
import { personNoteReadPermissions } from '$lib/zero/query/person_note/permissions';
import { eq } from 'drizzle-orm';

import { parse } from 'valibot';
import {
	createMutatorSchemaZero,
	type CreateMutatorSchemaZero,
	updateMutatorSchemaZero,
	type UpdateMutatorSchemaZero,
	deleteMutatorSchemaZero,
	type DeleteMutatorSchemaZero
} from '$lib/schema/person-note';

import { getPerson } from '$lib/server/api/data/person/person';
import { getQueue } from '$lib/server/queue';

export async function createPersonNote({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string }; // we want to make sure the userId is set here. Creating a person note is a user action and should not be allowed via the API
	args: CreateMutatorSchemaZero;
}) {
	const parsed = parse(createMutatorSchemaZero, args);

	//make sure the person exists and has permissions
	await getPerson({
		tx,
		ctx,
		args: { organizationId: parsed.metadata.organizationId, personId: parsed.metadata.personId }
	});
	const personNoteToCreate: typeof personNote.$inferInsert = {
		id: args.metadata.personNoteId,
		organizationId: args.metadata.organizationId,
		personId: args.metadata.personId,
		note: args.input.note,
		userId: ctx.userId,
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
	const queue = await getQueue();
	queue.insertActivity({
		organizationId: args.metadata.organizationId,
		personId: result.personId,
		userId: ctx.userId,
		type: 'note_added',
		referenceId: args.metadata.personNoteId,
		unread: false
	});

	return result;
}

export async function updatePersonNote({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchemaZero;
}) {
	const parsed = parse(updateMutatorSchemaZero, args);
	const personNoteRecord = await tx.run(
		builder.personNote
			.where('id', '=', parsed.metadata.personNoteId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => personNoteReadPermissions(expr, ctx))
			.one()
	);
	if (!personNoteRecord) {
		throw new Error('Person note not found');
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(personNote)
		.set({
			note: parsed.input.note,
			updatedAt: new Date()
		})
		.where(eq(personNote.id, parsed.metadata.personNoteId))
		.returning();
	if (!result) {
		throw new Error('Unable to update person note');
	}
	return result;
}

export async function deletePersonNote({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteMutatorSchemaZero;
}) {
	const parsed = parse(deleteMutatorSchemaZero, args);
	const personNoteRecord = await tx.run(
		builder.personNote
			.where('id', '=', parsed.metadata.personNoteId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => personNoteReadPermissions(expr, ctx))
			.one()
	);
	if (!personNoteRecord) {
		throw new Error('Person note not found');
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(personNote)
		.set({ deletedAt: new Date() })
		.where(eq(personNote.id, parsed.metadata.personNoteId))
		.returning();
	if (!result) {
		throw new Error('Unable to delete person note');
	}
	return;
}
