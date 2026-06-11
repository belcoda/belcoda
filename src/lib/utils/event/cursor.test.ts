import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodeEventListCursor, encodeEventListCursor } from './cursor';

describe('encodeEventListCursor / decodeEventListCursor', () => {
	const row = {
		startsAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips event list cursor fields', () => {
		const cursor = encodeEventListCursor(row);
		expect(decodeEventListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodeEventListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodeEventListCursor(encodeCursor({ startsAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodeEventListCursor('invalid')).toBeNull();
	});
});
