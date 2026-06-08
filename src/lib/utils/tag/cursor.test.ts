import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodeTagListCursor, encodeTagListCursor } from './cursor';

describe('encodeTagListCursor / decodeTagListCursor', () => {
	const row = {
		createdAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips tag cursor fields', () => {
		const cursor = encodeTagListCursor(row);
		expect(decodeTagListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodeTagListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(decodeTagListCursor(encodeCursor({ createdAt: 'not-a-number', id: row.id }))).toBeNull();
		expect(decodeTagListCursor('invalid')).toBeNull();
	});
});
