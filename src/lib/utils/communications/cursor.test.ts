import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodeCommunicationsListCursor, encodeCommunicationsListCursor } from './cursor';

describe('encodeCommunicationsListCursor / decodeCommunicationsListCursor', () => {
	const row = {
		updatedAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips communications cursor fields', () => {
		const cursor = encodeCommunicationsListCursor(row);
		expect(decodeCommunicationsListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodeCommunicationsListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodeCommunicationsListCursor(encodeCursor({ updatedAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodeCommunicationsListCursor('invalid')).toBeNull();
	});
});
