import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { DEFAULT_LIST_PAGE_SIZE, MAX_LIST_PAGE_SIZE, listFilter } from '$lib/schema/helpers';

const organizationId = '01900000-0000-7000-8000-000000000000';

describe('listFilter pageSize', () => {
	it('uses the default when pageSize is omitted', () => {
		const result = v.parse(listFilter, { organizationId });

		expect(result.pageSize).toBe(DEFAULT_LIST_PAGE_SIZE);
	});

	it('accepts the maximum page size', () => {
		const result = v.parse(listFilter, { organizationId, pageSize: MAX_LIST_PAGE_SIZE });

		expect(result.pageSize).toBe(MAX_LIST_PAGE_SIZE);
	});

	it.each([0, -1, MAX_LIST_PAGE_SIZE + 1, 1_000_000])('rejects unsafe page size %s', (pageSize) => {
		expect(() => v.parse(listFilter, { organizationId, pageSize })).toThrow();
	});
});
