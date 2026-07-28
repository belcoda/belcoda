import { defineMutator } from '@rocicorp/zero';
import {
	markNotificationAsReadMutatorSchemaZero,
	dismissNotificationMutatorSchemaZero,
	markPersonWhatsappNotificationsAsReadMutatorSchemaZero,
	markAllNotificationsAsReadMutatorSchemaZero
} from '$lib/schema/notification';

export const markNotificationAsRead = defineMutator(
	markNotificationAsReadMutatorSchemaZero,
	async ({ tx, args }) => {
		tx.mutate.notification.update({
			id: args.metadata.notificationId,
			status: 'read',
			readAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);

export const dismissNotification = defineMutator(
	dismissNotificationMutatorSchemaZero,
	async ({ tx, args }) => {
		tx.mutate.notification.update({
			id: args.metadata.notificationId,
			status: 'dismissed',
			dismissedAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);

export const markPersonWhatsappNotificationsAsRead = defineMutator(
	markPersonWhatsappNotificationsAsReadMutatorSchemaZero,
	async () => {}
);

export const markAllNotificationsAsRead = defineMutator(
	markAllNotificationsAsReadMutatorSchemaZero,
	async () => {}
);
