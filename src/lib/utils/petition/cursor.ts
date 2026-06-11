import * as v from 'valibot';
import { petitionListCursorSchema, type PetitionListCursor } from '$lib/schema/petition/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodePetitionListCursor(row: PetitionListCursor): string {
	return encodeCursor(row);
}

export function decodePetitionListCursor(cursor: string): PetitionListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(petitionListCursorSchema, decoded);
	return result.success ? result.output : null;
}
