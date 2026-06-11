import { describe, it, expect } from 'vitest';
import { decodeCursor, decodeCursorOrNull, encodeCursor } from './cursor';

describe('encodeCursor / decodeCursor', () => {
	it('roundtrips arbitrary key-value pairs', () => {
		const values = { foo: 'bar', count: 42, empty: null };
		const cursor = encodeCursor(values);
		expect(decodeCursor(cursor)).toEqual(values);
	});

	it('roundtrips Unicode string values', () => {
		const values = { name: 'José', emoji: '🎉' };
		const cursor = encodeCursor(values);
		expect(decodeCursor(cursor)).toEqual(values);
	});

	it('decodes legacy ASCII-only cursors', () => {
		const values = { foo: 'bar', count: 42 };
		expect(decodeCursor(btoa(JSON.stringify(values)))).toEqual(values);
	});

	it('returns null for invalid base64', () => {
		expect(decodeCursorOrNull('not-valid-base64!!!')).toBeNull();
	});

	it('returns null for non-object JSON', () => {
		expect(decodeCursorOrNull(btoa(JSON.stringify('string')))).toBeNull();
		expect(decodeCursorOrNull(btoa(JSON.stringify([1, 2])))).toBeNull();
	});

	it('throws when decodeCursor receives invalid input', () => {
		expect(() => decodeCursor('!!!')).toThrow('Invalid cursor');
	});
});
