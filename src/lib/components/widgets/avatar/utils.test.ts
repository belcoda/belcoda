import { describe, it, expect } from 'vitest';
import { getAvatarFallback } from './utils';

describe('getAvatarFallback', () => {
	describe('null safety (BEL-588)', () => {
		it('should return null when both names are null', () => {
			expect(getAvatarFallback(null, null)).toBe(null);
		});

		it('should return null when both names are undefined', () => {
			expect(getAvatarFallback(undefined, undefined)).toBe(null);
		});

		it('should return null when name1 is null and name2 is undefined', () => {
			expect(getAvatarFallback(null, undefined)).toBe(null);
		});

		it('should handle null name1 with valid name2', () => {
			expect(getAvatarFallback(null, 'Doe')).toBe('Do');
		});

		it('should handle undefined name1 with valid name2', () => {
			expect(getAvatarFallback(undefined, 'Doe')).toBe('Do');
		});

		it('should handle valid name1 with null name2', () => {
			expect(getAvatarFallback('John', null)).toBe('Jo');
		});

		it('should handle valid name1 with undefined name2', () => {
			expect(getAvatarFallback('John', undefined)).toBe('Jo');
		});
	});

	describe('normal operation', () => {
		it('should return initials when both names are provided', () => {
			expect(getAvatarFallback('John', 'Doe')).toBe('JD');
		});

		it('should return first two characters when only one name is provided', () => {
			expect(getAvatarFallback('John', null)).toBe('Jo');
		});

		it('should handle emoji and special characters', () => {
			expect(getAvatarFallback('John 😀', 'Doe')).toBe('JD');
		});

		it('should return null for empty strings', () => {
			expect(getAvatarFallback('', '')).toBe(null);
		});

		it('should handle whitespace-only strings', () => {
			expect(getAvatarFallback('   ', '   ')).toBe(null);
		});
	});
});
