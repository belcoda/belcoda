import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodePersonListCursor, encodePersonListCursor } from './cursor';

describe('encodePersonListCursor / decodePersonListCursor', () => {
	const row = {
		mostRecentActivityAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips person cursor fields', () => {
		const cursor = encodePersonListCursor(row);
		expect(decodePersonListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodePersonListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodePersonListCursor(encodeCursor({ mostRecentActivityAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodePersonListCursor('invalid')).toBeNull();
	});
});
