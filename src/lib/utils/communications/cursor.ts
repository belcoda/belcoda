import * as v from 'valibot';
import {
	communicationsListCursorSchema,
	type CommunicationsListCursor
} from '$lib/schema/communications/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeCommunicationsListCursor(row: CommunicationsListCursor): string {
	return encodeCursor(row);
}

export function decodeCommunicationsListCursor(cursor: string): CommunicationsListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(communicationsListCursorSchema, decoded);
	return result.success ? result.output : null;
}
