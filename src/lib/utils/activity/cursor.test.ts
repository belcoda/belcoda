import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodeActivityListCursor, encodeActivityListCursor } from './cursor';

describe('encodeActivityListCursor / decodeActivityListCursor', () => {
	const row = {
		createdAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips activity list cursor fields', () => {
		const cursor = encodeActivityListCursor(row);
		expect(decodeActivityListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodeActivityListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodeActivityListCursor(encodeCursor({ createdAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodeActivityListCursor('invalid')).toBeNull();
	});
});
