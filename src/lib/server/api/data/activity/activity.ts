import type { ServerTransaction } from '@rocicorp/zero';

import { activity, person } from '$lib/schema/drizzle';
import { type ActivityType } from '$lib/schema/activity/types';
import { activityWebhook } from '$lib/schema/activity';
import { and, eq } from 'drizzle-orm';
import { generatePreview } from '$lib/server/api/utils/activity/generate_preview';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
import { parse } from 'valibot';

import { v7 as uuidv7 } from 'uuid';
async function triggerActivityCreatedWebhook({
	row,
	tx
}: {
	row: typeof activity.$inferSelect;
	tx: ServerTransaction;
}) {
	const { organizationId, ...data } = row;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId,
			payload: {
				type: 'activity.created',
				data: parse(activityWebhook, data)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
}

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
	const toInsert: typeof activity.$inferInsert = {
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
		.insert(activity)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create activity');
	}
	await triggerActivityCreatedWebhook({ row: result[0], tx });
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
	const toInsert: typeof activity.$inferInsert = {
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
		.insert(activity)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create activity');
	}
	await triggerActivityCreatedWebhook({ row: result[0], tx });
	return result[0];
}

export async function insertActivity({
	organizationId,
	personId,
	userId,
	type,
	referenceId,
	unread,
	tx
}: {
	organizationId: string;
	personId: string;
	type: ActivityType;
	userId?: string | null;
	referenceId: string;
	unread: boolean;
	tx: ServerTransaction;
}) {
	//check that personId belongs to the organization
	const personResult = await tx.dbTransaction.wrappedTransaction.query.person.findFirst({
		where: (row, { and, eq }) => and(eq(row.id, personId), eq(row.organizationId, organizationId))
	});
	if (!personResult) {
		throw new Error('Person not found in the organization. Cannot insert activity.');
	}
	const activityInsert: typeof activity.$inferInsert = {
		id: uuidv7(),
		organizationId,
		personId,
		type,
		referenceId,
		unread,
		userId: userId || null,
		createdAt: new Date()
	};
	const [insertedActivity] = await tx.dbTransaction.wrappedTransaction
		.insert(activity)
		.values(activityInsert)
		.returning();

	const preview = await generatePreview({ type, referenceId });
	await tx.dbTransaction.wrappedTransaction
		.update(person)
		.set({
			mostRecentActivityPreview: preview,
			mostRecentActivityAt: new Date()
		})
		.where(and(eq(person.id, personId), eq(person.organizationId, organizationId)));

	if (insertedActivity) {
		await triggerActivityCreatedWebhook({ row: insertedActivity, tx });
	}
}
