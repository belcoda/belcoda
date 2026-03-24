import { whatsappThread as whatsappThreadTable } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { builder } from '$lib/zero/schema';
import { whatsappThreadReadPermissions } from '$lib/zero/query/whatsapp_thread/permissions';

import {
	updateWhatsappThread as updateWhatsappThreadSchema,
	createWhatsappThread as createWhatsappThreadSchema,
	type CreateWhatsappThread as CreateWhatsappThreadSchema,
	type UpdateWhatsappThread as UpdateWhatsappThreadSchema
} from '$lib/schema/whatsapp-thread';
import { v7 as uuidv7 } from 'uuid';

import { parse } from 'valibot';

export async function createWhatsappThread({
	args,
	tx
}: {
	args: {
		id: string;
		thread: CreateWhatsappThreadSchema;
		organizationId: string;
	};
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const parsed = await parse(createWhatsappThreadSchema, args.thread);
	const insertedId = args.id || uuidv7();
	const now = new Date();
	const toInsert: typeof whatsappThreadTable.$inferInsert = {
		id: insertedId,
		organizationId: args.organizationId,
		teamId: null,
		flow: parsed.flow,
		sentBy: null,
		title: null,
		description: null,
		startedAt: null,
		completedAt: null,
		estimatedRecipientCount: 0,
		successfulRecipientCount: 0,
		failedRecipientCount: 0,
		estimatedCost: null,
		totalCost: null,
		createdAt: now,
		updatedAt: now
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(whatsappThreadTable)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create WhatsApp thread');
	}
	return result[0];
}

export async function updateWhatsappThread({
	args,
	tx
}: {
	args: { id: string; thread: UpdateWhatsappThreadSchema; organizationId: string };
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const parsed = await parse(updateWhatsappThreadSchema, args.thread);
	if (parsed.flow === undefined) {
		throw new Error('No fields to update');
	}
	const updated = await tx.dbTransaction.wrappedTransaction
		.update(whatsappThreadTable)
		.set({
			flow: parsed.flow,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(whatsappThreadTable.id, args.id),
				eq(whatsappThreadTable.organizationId, args.organizationId)
			)
		)
		.returning();
	if (updated.length === 0) {
		throw new Error('Failed to update WhatsApp thread');
	}
	return updated[0];
}

export async function deleteWhatsappThread({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: { id: string; organizationId: string };
}) {
	const record = await tx.run(
		builder.whatsappThread
			.where('id', '=', args.id)
			.where('organizationId', '=', args.organizationId)
			.where((expr) => whatsappThreadReadPermissions(expr, ctx))
			.one()
	);
	if (!record) {
		throw new Error('WhatsApp thread not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(whatsappThreadTable)
		.set({
			deletedAt: new Date(),
			updatedAt: new Date()
		})
		.where(
			and(
				eq(whatsappThreadTable.id, args.id),
				eq(whatsappThreadTable.organizationId, args.organizationId)
			)
		);
}
