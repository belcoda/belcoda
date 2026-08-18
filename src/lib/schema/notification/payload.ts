import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const notificationPayloadSchema = v.object({
	personName: v.optional(v.nullable(v.string())),
	personId: v.optional(v.nullable(helpers.uuid)),
	subjectTitle: v.optional(v.nullable(v.string())),
	noteAuthorName: v.optional(v.nullable(v.string())),
	notePreview: v.optional(v.nullable(v.string())),
	message: v.optional(v.nullable(v.string()))
});
export type NotificationPayload = v.InferOutput<typeof notificationPayloadSchema>;
