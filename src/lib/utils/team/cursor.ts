import * as v from 'valibot';
import { teamListCursorSchema, type TeamListCursor } from '$lib/schema/team/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeTeamListCursor(row: TeamListCursor): string {
	return encodeCursor(row);
}

export function decodeTeamListCursor(cursor: string): TeamListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(teamListCursorSchema, decoded);
	return result.success ? result.output : null;
}
