import * as v from 'valibot';
import { personListCursorSchema, type PersonListCursor } from '$lib/schema/person/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodePersonListCursor(row: PersonListCursor): string {
	return encodeCursor(row);
}

export function decodePersonListCursor(cursor: string): PersonListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(personListCursorSchema, decoded);
	return result.success ? result.output : null;
}
