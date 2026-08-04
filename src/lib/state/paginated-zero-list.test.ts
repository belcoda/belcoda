import { describe, expect, it } from 'vitest';
import {
	FavouriteFirstPaginatedZeroList,
	PaginatedZeroList,
	processPage
} from './paginated-zero-list.svelte';

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

describe('FavouriteFirstPaginatedZeroList', () => {
	it('paginates all favourites before starting the remaining rows', () => {
		const paginator = new FavouriteFirstPaginatedZeroList({
			getBaseFilter: () => ({ organizationId: 'org_1' }),
			getPrioritizeFavourites: () => true,
			encodeCursor: (row: { id: string }) => row.id,
			pageSize: 2
		});

		expect(paginator.favouritePageFilter?.favouriteMode).toBe('only');
		expect(paginator.remainingPageFilter).toBeNull();

		paginator.handleFavouritePage([{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }]);
		expect(paginator.items).toEqual([{ id: 'f1' }, { id: 'f2' }]);
		expect(paginator.hasMore).toBe(true);
		expect(paginator.remainingPageFilter).toBeNull();

		paginator.loadMore();
		expect(paginator.favouritePageFilter?.cursor).toBe('f2');
		paginator.handleFavouritePage([{ id: 'f3' }]);

		expect(paginator.remainingPageFilter).toMatchObject({
			favouriteMode: 'exclude',
			cursor: null
		});
		paginator.handleRemainingPage([{ id: 'r1' }, { id: 'r2' }]);
		expect(paginator.items).toEqual([
			{ id: 'f1' },
			{ id: 'f2' },
			{ id: 'f3' },
			{ id: 'r1' },
			{ id: 'r2' }
		]);
	});

	it('uses the normal all-rows query when prioritization is off', () => {
		const paginator = new FavouriteFirstPaginatedZeroList({
			getBaseFilter: () => ({ organizationId: 'org_1' }),
			getPrioritizeFavourites: () => false,
			encodeCursor: (row: { id: string }) => row.id,
			pageSize: 2
		});

		expect(paginator.favouritePageFilter).toBeNull();
		expect(paginator.remainingPageFilter?.favouriteMode).toBe('all');
		paginator.handleRemainingPage([{ id: '1' }, { id: '2' }, { id: '3' }]);
		expect(paginator.items).toEqual([{ id: '1' }, { id: '2' }]);

		paginator.loadMore();
		expect(paginator.remainingPageFilter?.cursor).toBe('2');
	});

	it('restarts with the all-rows query when prioritization is turned off', () => {
		let prioritizeFavourites = true;
		const paginator = new FavouriteFirstPaginatedZeroList({
			getBaseFilter: () => ({ organizationId: 'org_1' }),
			getPrioritizeFavourites: () => prioritizeFavourites,
			encodeCursor: (row: { id: string }) => row.id,
			pageSize: 2
		});

		paginator.handleFavouritePage([{ id: 'f1' }]);
		paginator.handleRemainingPage([{ id: 'r1' }]);
		prioritizeFavourites = false;

		expect(paginator.favouritePageFilter).toBeNull();
		expect(paginator.remainingPageFilter).toMatchObject({
			favouriteMode: 'all',
			cursor: null
		});
		paginator.handleRemainingPage([{ id: 'r2' }]);
		expect(paginator.items).toEqual([{ id: 'r2' }]);
	});

	it('keeps favourites first and deduplicates during live page updates', () => {
		const paginator = new FavouriteFirstPaginatedZeroList({
			getBaseFilter: () => ({ organizationId: 'org_1' }),
			getPrioritizeFavourites: () => true,
			encodeCursor: (row: { id: string }) => row.id,
			pageSize: 3
		});

		paginator.handleFavouritePage([{ id: 'f1' }]);
		paginator.handleRemainingPage([{ id: 'r1' }, { id: 'r2' }]);
		paginator.handleFavouritePage([{ id: 'r1' }, { id: 'f1' }]);

		expect(paginator.items).toEqual([{ id: 'r1' }, { id: 'f1' }, { id: 'r2' }]);
	});

	it('restarts with favourites when filters change', () => {
		let searchString: string | null = null;
		const paginator = new FavouriteFirstPaginatedZeroList({
			getBaseFilter: () => ({ organizationId: 'org_1', searchString }),
			getPrioritizeFavourites: () => true,
			encodeCursor: (row: { id: string }) => row.id,
			pageSize: 2
		});

		paginator.handleFavouritePage([{ id: 'f1' }]);
		paginator.handleRemainingPage([{ id: 'r1' }]);
		searchString = 'pat';

		expect(paginator.favouritePageFilter?.cursor).toBeNull();
		expect(paginator.remainingPageFilter).toBeNull();
		paginator.handleFavouritePage([{ id: 'f2' }]);
		expect(paginator.items).toEqual([{ id: 'f2' }]);
	});
});
