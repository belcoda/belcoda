import * as v from 'valibot';
import { activityListCursorSchema, type ActivityListCursor } from '$lib/schema/activity/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeActivityListCursor(row: ActivityListCursor): string {
	return encodeCursor(row);
}

export function decodeActivityListCursor(cursor: string): ActivityListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(activityListCursorSchema, decoded);
	return result.success ? result.output : null;
}
