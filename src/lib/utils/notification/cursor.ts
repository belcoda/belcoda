import * as v from 'valibot';
import {
	notificationListCursorSchema,
	type NotificationListCursor
} from '$lib/schema/notification/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeNotificationListCursor(row: NotificationListCursor): string {
	return encodeCursor(row);
}

export function decodeNotificationListCursor(cursor: string): NotificationListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(notificationListCursorSchema, decoded);
	return result.success ? result.output : null;
}
