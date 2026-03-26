import type { ServerTransaction } from '@rocicorp/zero';

import { activity as activityTable } from '$lib/schema/drizzle';

import { v7 as uuidv7 } from 'uuid';

export async function createActivityWhatsAppMessageIncoming({
	organizationId,
	personId,
	referenceId,
	unread = true,
	tx
}: {
	organizationId: string;
	personId: string;
	referenceId: string;
	unread?: boolean;
	tx: ServerTransaction;
}) {
	const toInsert: typeof activityTable.$inferInsert = {
		id: uuidv7(),
		organizationId,
		personId,
		userId: null,
		type: 'whatsapp_message_incoming',
		referenceId,
		unread,
		createdAt: new Date()
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(activityTable)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create activity');
	}
	return result[0];
}

export async function createActivityWhatsAppMessageOutgoing({
	organizationId,
	personId,
	referenceId,
	unread = true,
	tx
}: {
	organizationId: string;
	personId: string;
	referenceId: string;
	unread?: boolean;
	tx: ServerTransaction;
}) {
	const toInsert: typeof activityTable.$inferInsert = {
		id: uuidv7(),
		organizationId,
		personId,
		userId: null,
		type: 'whatsapp_message_outgoing',
		referenceId,
		unread,
		createdAt: new Date()
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(activityTable)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create activity');
	}
	return result[0];
}
