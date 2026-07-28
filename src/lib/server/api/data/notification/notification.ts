import type { ServerTransaction } from '@rocicorp/zero';
import { and, eq, inArray } from 'drizzle-orm';
import { parse } from 'valibot';
import { v7 as uuidv7 } from 'uuid';

import { member, notification, user } from '$lib/schema/drizzle';
import {
	createNotificationSchema,
	type CreateNotificationSchema,
	notifyConversationMutatorSchemaZero,
	type NotifyConversationMutatorSchemaZero,
	markNotificationAsReadMutatorSchemaZero,
	type MarkNotificationAsReadMutatorSchemaZero,
	dismissNotificationMutatorSchemaZero,
	type DismissNotificationMutatorSchemaZero,
	markAllNotificationsAsReadMutatorSchemaZero,
	type MarkAllNotificationsAsReadMutatorSchemaZero
} from '$lib/schema/notification';
import { builder, type QueryContext } from '$lib/zero/schema';
import { notificationReadPermissions } from '$lib/zero/query/notification/permissions';
import { getOrganizationMember } from '$lib/server/api/data/organization/member';
import { getPerson } from '$lib/server/api/data/person/person';
import { insertActivity } from '$lib/server/api/data/activity/activity';

async function resolveNotificationRecipients({
	tx,
	organizationId,
	recipientUserIds,
	creatorUserId
}: {
	tx: ServerTransaction;
	organizationId: string;
	recipientUserIds: string[] | undefined;
	creatorUserId: string | null;
}): Promise<string[]> {
	if (recipientUserIds !== undefined) {
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
	const recipients = await resolveNotificationRecipients({
		tx,
		organizationId: parsed.organizationId,
		recipientUserIds: parsed.routing?.recipientUserIds,
		creatorUserId: parsed.routing?.creatorUserId ?? null
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

export async function notifyConversation({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string };
	args: NotifyConversationMutatorSchemaZero;
}) {
	const parsed = parse(notifyConversationMutatorSchemaZero, args);
	const { organizationId, personId, requestId } = parsed.metadata;
	const recipientUserIds = [...new Set(parsed.input.recipientUserIds)].filter(
		(userId) => userId !== ctx.userId
	);

	if (recipientUserIds.length === 0) {
		throw new Error('Select at least one other organization member');
	}

	await getOrganizationMember({ tx, args: { organizationId, userId: ctx.userId } });
	const personRecord = await getPerson({
		tx,
		ctx,
		args: { organizationId, personId }
	});

	const recipients = await tx.dbTransaction.wrappedTransaction
		.select({ userId: member.userId })
		.from(member)
		.where(
			and(eq(member.organizationId, organizationId), inArray(member.userId, recipientUserIds))
		);
	if (recipients.length !== recipientUserIds.length) {
		throw new Error('All recipients must be organization members');
	}

	const [actor] = await tx.dbTransaction.wrappedTransaction
		.select({ name: user.name })
		.from(user)
		.where(eq(user.id, ctx.userId))
		.limit(1);
	if (!actor) {
		throw new Error('User not found');
	}

	const personName =
		[personRecord.givenName, personRecord.familyName].filter(Boolean).join(' ') ||
		personRecord.phoneNumber;

	const createdNotifications = await createNotification({
		tx,
		args: {
			type: 'conversation_mention',
			organizationId,
			referenceId: personId,
			sourceKey: `conversation_mention:${requestId}`,
			payload: {
				actorName: actor.name,
				personId,
				personName
			},
			routing: { recipientUserIds, creatorUserId: null }
		}
	});

	if (createdNotifications.length > 0) {
		await insertActivity({
			organizationId,
			personId,
			userId: ctx.userId,
			type: 'conversation_teammates_notified',
			referenceId: requestId,
			unread: false,
			tx
		});
	}

	return createdNotifications;
}

export async function markNotificationAsRead({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string };
	args: MarkNotificationAsReadMutatorSchemaZero;
}) {
	const parsed = parse(markNotificationAsReadMutatorSchemaZero, args);
	const row = await tx.run(
		builder.notification
			.where('id', '=', parsed.metadata.notificationId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => notificationReadPermissions(expr, ctx))
			.one()
	);
	if (!row) {
		throw new Error('Notification not found');
	}
	if (row.status !== 'unread') {
		return row;
	}
	const now = new Date();
	const [updated] = await tx.dbTransaction.wrappedTransaction
		.update(notification)
		.set({
			status: 'read',
			readAt: now,
			updatedAt: now
		})
		.where(
			and(
				eq(notification.id, row.id),
				eq(notification.organizationId, row.organizationId),
				eq(notification.status, 'unread')
			)
		)
		.returning();
	if (!updated) {
		const latestRow = await tx.run(
			builder.notification
				.where('id', '=', parsed.metadata.notificationId)
				.where('organizationId', '=', parsed.metadata.organizationId)
				.where((expr) => notificationReadPermissions(expr, ctx))
				.one()
		);
		if (latestRow) {
			return latestRow;
		}
		throw new Error('Unable to mark notification as read');
	}
	return updated;
}

export async function dismissNotification({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string };
	args: DismissNotificationMutatorSchemaZero;
}) {
	const parsed = parse(dismissNotificationMutatorSchemaZero, args);
	const row = await tx.run(
		builder.notification
			.where('id', '=', parsed.metadata.notificationId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => notificationReadPermissions(expr, ctx))
			.one()
	);
	if (!row) {
		throw new Error('Notification not found');
	}
	if (row.status === 'dismissed') {
		return row;
	}
	const now = new Date();
	const [updated] = await tx.dbTransaction.wrappedTransaction
		.update(notification)
		.set({
			status: 'dismissed',
			dismissedAt: now,
			updatedAt: now
		})
		.where(and(eq(notification.id, row.id), eq(notification.organizationId, row.organizationId)))
		.returning();
	if (!updated) {
		throw new Error('Unable to dismiss notification');
	}
	return updated;
}

export async function markAllNotificationsAsRead({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string };
	args: MarkAllNotificationsAsReadMutatorSchemaZero;
}) {
	const parsed = parse(markAllNotificationsAsReadMutatorSchemaZero, args);
	await getOrganizationMember({
		tx,
		args: { organizationId: parsed.metadata.organizationId, userId: ctx.userId }
	});
	const now = new Date();
	return tx.dbTransaction.wrappedTransaction
		.update(notification)
		.set({
			status: 'read',
			readAt: now,
			updatedAt: now
		})
		.where(
			and(
				eq(notification.organizationId, parsed.metadata.organizationId),
				eq(notification.userId, ctx.userId),
				eq(notification.status, 'unread')
			)
		)
		.returning();
}
