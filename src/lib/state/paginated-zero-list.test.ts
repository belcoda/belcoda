import { describe, expect, it } from 'vitest';
import { PaginatedZeroList, processPage } from './paginated-zero-list.svelte';

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

describe('PaginatedZeroList', () => {
	it('accumulates pages and dedupes by id', () => {
		const paginator = new PaginatedZeroList({
			getBaseFilter: () => ({ organizationId: 'org_1' }),
			encodeCursor: (row: { id: string }) => row.id,
			pageSize: 2
		});

		paginator.handlePage([{ id: '1' }, { id: '2' }, { id: '3' }]);
		expect(paginator.items).toEqual([{ id: '1' }, { id: '2' }]);
		expect(paginator.hasMore).toBe(true);

		paginator.loadMore();
		expect(paginator.pageFilter.cursor).toBe('2');

		paginator.handlePage([{ id: '2' }, { id: '3' }]);
		expect(paginator.items).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
		expect(paginator.hasMore).toBe(false);
	});

	it('resets accumulated rows when the base filter changes', () => {
		let searchString: string | null = null;
		const paginator = new PaginatedZeroList({
			getBaseFilter: () => ({ organizationId: 'org_1', searchString }),
			encodeCursor: (row: { id: string }) => row.id,
			pageSize: 2
		});

		paginator.handlePage([{ id: '1' }, { id: '2' }, { id: '3' }]);
		paginator.loadMore();
		searchString = 'pat';

		expect(paginator.pageFilter.cursor).toBeNull();

		paginator.handlePage([{ id: '4' }]);
		expect(paginator.items).toEqual([{ id: '4' }]);
		expect(paginator.cursor).toBeNull();
	});
});
