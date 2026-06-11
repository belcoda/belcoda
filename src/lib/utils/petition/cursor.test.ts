import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodePetitionListCursor, encodePetitionListCursor } from './cursor';

describe('encodePetitionListCursor / decodePetitionListCursor', () => {
	const row = {
		createdAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips petition cursor fields', () => {
		const cursor = encodePetitionListCursor(row);
		expect(decodePetitionListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodePetitionListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodePetitionListCursor(encodeCursor({ createdAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodePetitionListCursor('invalid')).toBeNull();
	});
});
