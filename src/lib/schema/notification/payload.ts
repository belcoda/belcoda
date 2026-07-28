import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const notificationPayloadSchema = v.object({
	actorName: v.optional(v.nullable(v.string())),
	personName: v.optional(v.nullable(v.string())),
	personId: v.optional(v.nullable(helpers.uuid)),
	subjectTitle: v.optional(v.nullable(v.string())),
	message: v.optional(v.nullable(v.string()))
});
export type NotificationPayload = v.InferOutput<typeof notificationPayloadSchema>;
