import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
	it('returns an empty string when input is empty or whitespace', () => {
		expect(slugify('')).toBe('');
		expect(slugify('   ')).toBe('');
	});

	it('returns an empty string when stripping leaves nothing to parse', () => {
		expect(slugify('!!!')).toBe('');
		expect(slugify('你好')).toBe('');
		expect(slugify('@#$%^&')).toBe('');
	});

	it('slugifies alphanumeric titles', () => {
		expect(slugify('Hello World')).toBe('hello-world');
		expect(slugify('  Café 123  ')).toBe('caf-123');
	});
});
