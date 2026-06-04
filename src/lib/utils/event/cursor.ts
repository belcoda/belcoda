import * as v from 'valibot';
import { eventListCursorSchema, type EventListCursor } from '$lib/schema/event/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeEventListCursor(row: EventListCursor): string {
	return encodeCursor(row);
}

export function decodeEventListCursor(cursor: string): EventListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(eventListCursorSchema, decoded);
	return result.success ? result.output : null;
}
