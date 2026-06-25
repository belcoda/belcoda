import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const notificationListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type NotificationListCursor = v.InferOutput<typeof notificationListCursorSchema>;
