import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
	it.each([
		['', ''],
		['   ', ''],
		['!!!', ''],
		['你好', ''],
		['@#$%^&', ''],
		['---', ''],
		['@#$ %^&', ''],
		['Hello World', 'hello-world'],
		['  Café 123  ', 'caf-123']
	] as const)('maps %j to %j', (input, expected) => {
		expect(slugify(input)).toBe(expected);
	});
});
