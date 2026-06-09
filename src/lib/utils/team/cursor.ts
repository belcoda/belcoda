import * as v from 'valibot';
import { teamListCursorSchema, type TeamListCursor } from '$lib/schema/team/cursor';
import { uuid } from '$lib/schema/helpers';
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

/** REST `/api/v1/teams` passes the last row id as `cursor`. */
export function decodeRestTeamListCursor(cursor: string): { id: string } | null {
	const result = v.safeParse(uuid, cursor);
	return result.success ? { id: result.output } : null;
}
