import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodePersonNoteListCursor, encodePersonNoteListCursor } from './cursor';

describe('encodePersonNoteListCursor / decodePersonNoteListCursor', () => {
	const row = {
		createdAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips person note cursor fields', () => {
		const cursor = encodePersonNoteListCursor(row);
		expect(decodePersonNoteListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodePersonNoteListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodePersonNoteListCursor(encodeCursor({ createdAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodePersonNoteListCursor('invalid')).toBeNull();
	});
});
