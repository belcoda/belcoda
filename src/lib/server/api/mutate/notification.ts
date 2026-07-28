import { defineMutator } from '@rocicorp/zero';
import {
	markNotificationAsReadMutatorSchemaZero,
	dismissNotificationMutatorSchemaZero,
	markPersonWhatsappNotificationsAsReadMutatorSchemaZero,
	markAllNotificationsAsReadMutatorSchemaZero,
  notifyConversationMutatorSchemaZero
} from '$lib/schema/notification';
import * as dataFunctions from '$lib/server/api/data/notification/notification';

export const notifyConversation = defineMutator(
	notifyConversationMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('notifyConversation can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('notifyConversation can only be called by a user');
		}
		await dataFunctions.notifyConversation({ tx, ctx: { ...ctx, userId: ctx.userId }, args });
	}
);

export const markNotificationAsRead = defineMutator(
	markNotificationAsReadMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('markNotificationAsRead can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('markNotificationAsRead can only be called by a user');
		}
		await dataFunctions.markNotificationAsRead({ tx, ctx: { ...ctx, userId: ctx.userId }, args });
	}
);

export const dismissNotification = defineMutator(
	dismissNotificationMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('dismissNotification can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('dismissNotification can only be called by a user');
		}
		await dataFunctions.dismissNotification({ tx, ctx: { ...ctx, userId: ctx.userId }, args });
	}
);

export const markPersonWhatsappNotificationsAsRead = defineMutator(
	markPersonWhatsappNotificationsAsReadMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('markPersonWhatsappNotificationsAsRead can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('markPersonWhatsappNotificationsAsRead can only be called by a user');
		}
		await dataFunctions.markPersonWhatsappNotificationsAsRead({
			tx,
			ctx: { ...ctx, userId: ctx.userId },
			args
		});
	}
);

export const markAllNotificationsAsRead = defineMutator(
	markAllNotificationsAsReadMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('markAllNotificationsAsRead can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('markAllNotificationsAsRead can only be called by a user');
		}
		await dataFunctions.markAllNotificationsAsRead({
			tx,
			ctx: { ...ctx, userId: ctx.userId },
			args
		});
	}
);
