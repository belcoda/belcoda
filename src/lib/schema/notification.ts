import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const notificationStatuses = ['unread', 'read', 'dismissed'] as const;
export const notificationStatus = v.picklist(notificationStatuses);
export type NotificationStatus = v.InferOutput<typeof notificationStatus>;

export const notificationSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	userId: helpers.uuid,
	type: helpers.shortString,
	referenceId: helpers.uuid,
	sourceKey: helpers.mediumString,
	payload: v.nullable(helpers.jsonSchema),
	status: notificationStatus,
	readAt: v.nullable(helpers.date),
	dismissedAt: v.nullable(helpers.date),
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type NotificationSchema = v.InferOutput<typeof notificationSchema>;

export const readNotificationZero = v.object({
	...notificationSchema.entries,
	readAt: v.nullable(helpers.dateToTimestamp),
	dismissedAt: v.nullable(helpers.dateToTimestamp),
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadNotificationZero = v.InferOutput<typeof readNotificationZero>;
