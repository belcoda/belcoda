import { describe, expect, it } from 'vitest';
import { processPage } from './paginated-zero-list.svelte';

describe('processPage', () => {
	it('marks hasMore when rows include an extra item', () => {
		expect(processPage([1, 2, 3], 2)).toEqual({
			items: [1, 2],
			hasMore: true
		});
	});

	it('does not mark hasMore at the page boundary', () => {
		expect(processPage([1, 2], 2)).toEqual({
			items: [1, 2],
			hasMore: false
		});
	});
});
