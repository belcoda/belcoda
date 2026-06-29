import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const notificationPayloadSchema = v.object({
	personName: v.optional(v.nullable(v.string())),
	personId: v.optional(v.nullable(helpers.uuid)),
	subjectTitle: v.optional(v.nullable(v.string())),
	message: v.optional(v.nullable(v.string()))
});
export type NotificationPayload = v.InferOutput<typeof notificationPayloadSchema>;

export const notificationStatuses = ['unread', 'read', 'dismissed'] as const;
export const notificationStatus = v.picklist(notificationStatuses);
export type NotificationStatus = v.InferOutput<typeof notificationStatus>;

export const createNotificationRoutingSchema = v.object({
	recipientUserIds: v.optional(v.array(helpers.uuid)),
	creatorUserId: v.optional(v.nullable(helpers.uuid), null)
});
export type CreateNotificationRoutingSchema = v.InferOutput<typeof createNotificationRoutingSchema>;

const notificationCreateBaseSchema = {
	organizationId: helpers.uuid,
	referenceId: helpers.uuid,
	sourceKey: helpers.mediumString,
	payload: v.optional(v.nullable(helpers.jsonSchema)),
	routing: v.optional(createNotificationRoutingSchema)
};

export const createNotificationSchema = v.variant('type', [
	v.object({
		type: v.literal('whatsapp_unread'),
		...notificationCreateBaseSchema
	}),
	v.object({
		type: v.literal('whatsapp_message'),
		...notificationCreateBaseSchema
	}),
	v.object({
		type: v.literal('flow_notify_user'),
		...notificationCreateBaseSchema
	}),
	v.object({
		type: v.literal('event_signup'),
		...notificationCreateBaseSchema
	}),
	v.object({
		type: v.literal('petition_signup'),
		...notificationCreateBaseSchema
	}),
	v.object({
		type: v.literal('generic'),
		...notificationCreateBaseSchema
	})
]);
export type CreateNotificationSchema = v.InferOutput<typeof createNotificationSchema>;

export const notificationMutatorMetadata = v.object({
	organizationId: helpers.uuid,
	notificationId: helpers.uuid
});
export type NotificationMutatorMetadata = v.InferOutput<typeof notificationMutatorMetadata>;

export const markNotificationAsReadMutatorSchemaZero = v.object({
	metadata: notificationMutatorMetadata
});
export type MarkNotificationAsReadMutatorSchemaZero = v.InferOutput<
	typeof markNotificationAsReadMutatorSchemaZero
>;

export const dismissNotificationMutatorSchemaZero = v.object({
	metadata: notificationMutatorMetadata
});
export type DismissNotificationMutatorSchemaZero = v.InferOutput<
	typeof dismissNotificationMutatorSchemaZero
>;

export const markAllNotificationsAsReadMutatorSchemaZero = v.object({
	metadata: v.pick(notificationMutatorMetadata, ['organizationId'])
});
export type MarkAllNotificationsAsReadMutatorSchemaZero = v.InferOutput<
	typeof markAllNotificationsAsReadMutatorSchemaZero
>;

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
