import { describe, expect, it } from 'vitest';
import { escapeLikeLiteral } from './list';

describe('escapeLikeLiteral', () => {
	it('escapes LIKE wildcards and backslashes for literal user searches', () => {
		expect(escapeLikeLiteral(String.raw`name\\_%`)).toBe(String.raw`name\\\\\_\%`);
	});
});
