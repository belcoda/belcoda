import * as v from 'valibot';
import { tagListCursorSchema, type TagListCursor } from '$lib/schema/tag/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeTagListCursor(row: TagListCursor): string {
	return encodeCursor(row);
}

export function decodeTagListCursor(cursor: string): TagListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(tagListCursorSchema, decoded);
	return result.success ? result.output : null;
}
