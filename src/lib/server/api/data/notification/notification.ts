import type { ServerTransaction } from '@rocicorp/zero';
import { and, eq } from 'drizzle-orm';
import { parse } from 'valibot';
import { v7 as uuidv7 } from 'uuid';

import { member, notification } from '$lib/schema/drizzle';
import { createNotificationSchema, type CreateNotificationSchema } from '$lib/schema/notification';

async function resolveNotificationRecipients({
	tx,
	organizationId,
	recipientUserIds,
	creatorUserId
}: {
	tx: ServerTransaction;
	organizationId: string;
	recipientUserIds: string[];
	creatorUserId: string | null;
}): Promise<string[]> {
	if (recipientUserIds.length > 0) {
		return [...new Set(recipientUserIds)];
	}

	const memberships = await tx.dbTransaction.wrappedTransaction
		.select({ userId: member.userId })
		.from(member)
		.where(eq(member.organizationId, organizationId));

	if (memberships.length === 1) {
		return [memberships[0].userId];
	}

	if (creatorUserId) {
		const [creatorMembership] = await tx.dbTransaction.wrappedTransaction
			.select({ userId: member.userId })
			.from(member)
			.where(and(eq(member.organizationId, organizationId), eq(member.userId, creatorUserId)))
			.limit(1);
		if (creatorMembership) {
			return [creatorMembership.userId];
		}
	}

	return [];
}

export async function createNotification({
	tx,
	args
}: {
	tx: ServerTransaction;
	args: CreateNotificationSchema;
}) {
	const parsed = parse(createNotificationSchema, args);
	const routing = parsed.routing ?? { recipientUserIds: [], creatorUserId: null };
	const recipients = await resolveNotificationRecipients({
		tx,
		organizationId: parsed.organizationId,
		recipientUserIds: routing.recipientUserIds,
		creatorUserId: routing.creatorUserId
	});

	if (recipients.length === 0) {
		return [];
	}

	const now = new Date();
	const values: (typeof notification.$inferInsert)[] = recipients.map((userId) => ({
		id: uuidv7(),
		organizationId: parsed.organizationId,
		userId,
		type: parsed.type,
		referenceId: parsed.referenceId,
		sourceKey: parsed.sourceKey,
		payload: parsed.payload ?? null,
		status: 'unread',
		readAt: null,
		dismissedAt: null,
		createdAt: now,
		updatedAt: now
	}));

	return tx.dbTransaction.wrappedTransaction
		.insert(notification)
		.values(values)
		.onConflictDoNothing({
			target: [notification.organizationId, notification.userId, notification.sourceKey]
		})
		.returning();
}
