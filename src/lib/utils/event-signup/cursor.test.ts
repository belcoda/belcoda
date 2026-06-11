import { describe, it, expect } from 'vitest';
import { encodeCursor } from '$lib/utils/cursor';
import {
	decodeEventSignupListCursor,
	decodeRestEventSignupListCursor,
	encodeEventSignupListCursor
} from './cursor';

describe('encodeEventSignupListCursor / decodeEventSignupListCursor', () => {
	const row = {
		createdAt: 1_700_000_000_000,
		id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
	};

	it('roundtrips event signup cursor fields', () => {
		const cursor = encodeEventSignupListCursor(row);
		expect(decodeEventSignupListCursor(cursor)).toEqual(row);
	});

	it('returns null when required fields are missing or wrong type', () => {
		expect(decodeEventSignupListCursor(encodeCursor({ id: row.id }))).toBeNull();
		expect(
			decodeEventSignupListCursor(encodeCursor({ createdAt: 'not-a-number', id: row.id }))
		).toBeNull();
		expect(decodeEventSignupListCursor('invalid')).toBeNull();
	});
});

describe('decodeRestEventSignupListCursor', () => {
	const signupId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

	it('accepts a raw signup id for REST pagination', () => {
		expect(decodeRestEventSignupListCursor(signupId)).toEqual({ id: signupId });
	});

	it('returns null for invalid values', () => {
		expect(decodeRestEventSignupListCursor('not-a-uuid')).toBeNull();
		expect(decodeRestEventSignupListCursor('')).toBeNull();
	});
});
