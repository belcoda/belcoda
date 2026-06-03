import * as v from 'valibot';
import {
	personNoteListCursorSchema,
	type PersonNoteListCursor
} from '$lib/schema/person-note/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodePersonNoteListCursor(row: PersonNoteListCursor): string {
	return encodeCursor(row);
}

export function decodePersonNoteListCursor(cursor: string): PersonNoteListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(personNoteListCursorSchema, decoded);
	return result.success ? result.output : null;
}
