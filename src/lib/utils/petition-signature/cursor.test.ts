import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodePetitionSignatureListCursor, encodePetitionSignatureListCursor } from './cursor';

describe('encodePetitionSignatureListCursor / decodePetitionSignatureListCursor', () => {
	const row = {
		createdAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips petition signature cursor fields', () => {
		const cursor = encodePetitionSignatureListCursor(row);
		expect(decodePetitionSignatureListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodePetitionSignatureListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodePetitionSignatureListCursor(encodeCursor({ createdAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodePetitionSignatureListCursor('invalid')).toBeNull();
	});
});
