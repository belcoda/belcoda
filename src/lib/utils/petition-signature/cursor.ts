import * as v from 'valibot';
import {
	petitionSignatureListCursorSchema,
	type PetitionSignatureListCursor
} from '$lib/schema/petition-signature/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodePetitionSignatureListCursor(row: PetitionSignatureListCursor): string {
	return encodeCursor(row);
}

export function decodePetitionSignatureListCursor(
	cursor: string
): PetitionSignatureListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(petitionSignatureListCursorSchema, decoded);
	return result.success ? result.output : null;
}
