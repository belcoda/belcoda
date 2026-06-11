import * as v from 'valibot';
import {
	eventSignupListCursorSchema,
	type EventSignupListCursor
} from '$lib/schema/event-signup/cursor';
import { uuid } from '$lib/schema/helpers';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeEventSignupListCursor(row: EventSignupListCursor): string {
	return encodeCursor(row);
}

export function decodeEventSignupListCursor(cursor: string): EventSignupListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(eventSignupListCursorSchema, decoded);
	return result.success ? result.output : null;
}

/** REST `/api/v1/events/:eventId/signups` passes the last row id as `cursor`. */
export function decodeRestEventSignupListCursor(cursor: string): { id: string } | null {
	const result = v.safeParse(uuid, cursor);
	return result.success ? { id: result.output } : null;
}
