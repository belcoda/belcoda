import * as v from 'valibot';
import { tagListCursorSchema, type TagListCursor } from '$lib/schema/tag/cursor';
import { uuid } from '$lib/schema/helpers';
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

/** REST `/api/v1/tags` passes the last row id as `cursor`. */
export function decodeRestTagListCursor(cursor: string): { id: string } | null {
	const result = v.safeParse(uuid, cursor);
	return result.success ? { id: result.output } : null;
}
