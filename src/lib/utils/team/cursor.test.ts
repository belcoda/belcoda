import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import { decodeRestTeamListCursor, decodeTeamListCursor, encodeTeamListCursor } from './cursor';

describe('encodeTeamListCursor / decodeTeamListCursor', () => {
	const row = {
		createdAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips team cursor fields', () => {
		const cursor = encodeTeamListCursor(row);
		expect(decodeTeamListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodeTeamListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodeTeamListCursor(encodeCursor({ createdAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodeTeamListCursor('invalid')).toBeNull();
	});
});

describe('decodeRestTeamListCursor', () => {
	const teamId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

	it('accepts a raw team id for REST pagination', () => {
		expect(decodeRestTeamListCursor(teamId)).toEqual({ id: teamId });
	});

	it('returns null for invalid values', () => {
		expect(decodeRestTeamListCursor('not-a-uuid')).toBeNull();
		expect(decodeRestTeamListCursor('')).toBeNull();
	});
});
