type RowWithId = {
	id: string;
};

type PaginatedZeroListOptions<TFilter extends Record<string, unknown>, TItem extends RowWithId> = {
	getBaseFilter: () => TFilter;
	encodeCursor: (row: TItem) => string;
	pageSize?: number;
};

type FavouriteFirstPaginatedZeroListOptions<
	TFilter extends Record<string, unknown> & { excludedIds: string[] },
	TItem extends RowWithId
> = PaginatedZeroListOptions<TFilter, TItem> & {
	getPrioritizeFavourites: () => boolean;
};

type FavouritePageFilter<TFilter extends Record<string, unknown>> = TFilter & {
	cursor: string | null;
	pageSize: number;
	favouriteMode: 'all' | 'only';
};

export function processPage<T>(rows: readonly T[], pageSize: number) {
	const pageItems = rows.slice(0, pageSize);
	return {
		items: pageItems,
		hasMore: rows.length > pageSize
	};
}

export class PaginatedZeroList<TFilter extends Record<string, unknown>, TItem extends RowWithId> {
	#getBaseFilter: () => TFilter;
	#encodeCursor: (row: TItem) => string;
	#pageSize: number;
	#baseFilterKey: string;
	#items = $state<TItem[]>([]);
	#cursor = $state<string | null>(null);
	#hasMore = $state(false);
	#loadingMore = $state(false);

	constructor({
		getBaseFilter,
		encodeCursor,
		pageSize = 25
	}: PaginatedZeroListOptions<TFilter, TItem>) {
		if (!Number.isInteger(pageSize) || pageSize <= 0) {
			throw new Error('PaginatedZeroList pageSize must be a positive integer');
		}
		this.#getBaseFilter = getBaseFilter;
		this.#encodeCursor = encodeCursor;
		this.#pageSize = pageSize;
		this.#baseFilterKey = stableStringify(getBaseFilter());
	}

	get items() {
		return this.#items;
	}

	get hasMore() {
		return this.#hasMore;
	}

	get loadingMore() {
		return this.#loadingMore;
	}

	get cursor() {
		return this.#cursor;
	}

	get pageFilter(): TFilter & { cursor: string | null; pageSize: number } {
		const baseFilter = this.#getBaseFilter();
		const cursor = stableStringify(baseFilter) === this.#baseFilterKey ? this.#cursor : null;
		return {
			...baseFilter,
			cursor,
			pageSize: this.#pageSize
		};
	}

	handlePage(rows: readonly TItem[] | undefined) {
		if (rows === undefined) {
			return;
		}

		this.#resetIfBaseFilterChanged();

		const page = processPage(rows, this.#pageSize);
		if (this.#cursor === null) {
			this.#items = page.items;
		} else {
			this.#items = dedupeById([...this.#items, ...page.items]);
		}
		this.#hasMore = page.hasMore;
		this.#loadingMore = false;
	}

	loadMore() {
		if (!this.#hasMore || this.#loadingMore) {
			return;
		}
		const lastItem = this.#items.at(-1);
		if (!lastItem) {
			return;
		}
		this.#cursor = this.#encodeCursor(lastItem);
		this.#loadingMore = true;
	}

	reset() {
		this.#baseFilterKey = stableStringify(this.#getBaseFilter());
		this.#items = [];
		this.#cursor = null;
		this.#hasMore = false;
		this.#loadingMore = false;
	}

	#resetIfBaseFilterChanged() {
		const nextBaseFilterKey = stableStringify(this.#getBaseFilter());
		if (nextBaseFilterKey !== this.#baseFilterKey) {
			this.reset();
		}
	}
}

/**
 * Cursor pagination for lists that show every matching favourite before the remaining rows.
 * The favourite query stays active after the remaining query starts so the favourite section
 * can continue reacting to Zero updates.
 */
export class FavouriteFirstPaginatedZeroList<
	TFilter extends Record<string, unknown> & { excludedIds: string[] },
	TItem extends RowWithId
> {
	#getBaseFilter: () => TFilter;
	#getPrioritizeFavourites: () => boolean;
	#encodeCursor: (row: TItem) => string;
	#pageSize: number;
	#baseFilterKey = $state('');
	#favouriteItems = $state<TItem[]>([]);
	#remainingItems = $state<TItem[]>([]);
	#favouriteCursor = $state<string | null>(null);
	#remainingCursor = $state<string | null>(null);
	#favouriteHasMore = $state(false);
	#remainingHasMore = $state(false);
	#favouritesComplete = $state(false);
	#loadingMore = $state(false);

	constructor({
		getBaseFilter,
		getPrioritizeFavourites,
		encodeCursor,
		pageSize = 25
	}: FavouriteFirstPaginatedZeroListOptions<TFilter, TItem>) {
		if (!Number.isInteger(pageSize) || pageSize <= 0) {
			throw new Error('FavouriteFirstPaginatedZeroList pageSize must be a positive integer');
		}
		this.#getBaseFilter = getBaseFilter;
		this.#getPrioritizeFavourites = getPrioritizeFavourites;
		this.#encodeCursor = encodeCursor;
		this.#pageSize = pageSize;
		this.#baseFilterKey = this.#currentFilterKey();
	}

	get items() {
		if (!this.#getPrioritizeFavourites()) {
			return this.#remainingItems;
		}
		return dedupeById([...this.#favouriteItems, ...this.#remainingItems]);
	}

	get hasMore() {
		if (!this.#getPrioritizeFavourites()) {
			return this.#remainingHasMore;
		}
		return this.#favouriteHasMore || (this.#favouritesComplete && this.#remainingHasMore);
	}

	get loadingMore() {
		return this.#loadingMore;
	}

	get favouritePageFilter(): FavouritePageFilter<TFilter> | null {
		if (!this.#getPrioritizeFavourites()) {
			return null;
		}
		const baseFilter = this.#getBaseFilter();
		const cursor = this.#currentFilterKey() === this.#baseFilterKey ? this.#favouriteCursor : null;
		return {
			...baseFilter,
			favouriteMode: 'only',
			cursor,
			pageSize: this.#pageSize
		};
	}

	get remainingPageFilter(): FavouritePageFilter<TFilter> | null {
		const prioritizeFavourites = this.#getPrioritizeFavourites();
		const filterMatches = this.#currentFilterKey() === this.#baseFilterKey;
		if (prioritizeFavourites && (!filterMatches || !this.#favouritesComplete)) {
			return null;
		}
		const baseFilter = this.#getBaseFilter();
		return {
			...baseFilter,
			excludedIds: prioritizeFavourites
				? [...new Set([...baseFilter.excludedIds, ...this.#favouriteItems.map((item) => item.id)])]
				: baseFilter.excludedIds,
			favouriteMode: 'all',
			cursor: filterMatches ? this.#remainingCursor : null,
			pageSize: this.#pageSize
		};
	}

	handleFavouritePage(rows: readonly TItem[] | undefined) {
		if (rows === undefined || !this.#getPrioritizeFavourites()) {
			return;
		}
		this.#resetIfBaseFilterChanged();
		const page = processPage(rows, this.#pageSize);
		const nextFavouriteItems =
			this.#favouriteCursor === null
				? page.items
				: dedupeById([...this.#favouriteItems, ...page.items]);
		if (!haveSameIds(this.#favouriteItems, nextFavouriteItems)) {
			this.#remainingItems = [];
			this.#remainingCursor = null;
			this.#remainingHasMore = false;
		}
		this.#favouriteItems = nextFavouriteItems;
		this.#favouriteHasMore = page.hasMore;
		this.#favouritesComplete = !page.hasMore;
		this.#loadingMore = false;
	}

	handleRemainingPage(rows: readonly TItem[] | undefined) {
		if (rows === undefined) {
			return;
		}
		this.#resetIfBaseFilterChanged();
		const page = processPage(rows, this.#pageSize);
		this.#remainingItems =
			this.#remainingCursor === null
				? page.items
				: dedupeById([...this.#remainingItems, ...page.items]);
		this.#remainingHasMore = page.hasMore;
		this.#loadingMore = false;
	}

	loadMore() {
		if (!this.hasMore || this.#loadingMore) {
			return;
		}
		if (this.#getPrioritizeFavourites() && this.#favouriteHasMore) {
			const lastFavourite = this.#favouriteItems.at(-1);
			if (!lastFavourite) return;
			this.#favouriteCursor = this.#encodeCursor(lastFavourite);
		} else {
			const lastRemaining = this.#remainingItems.at(-1);
			if (!lastRemaining) return;
			this.#remainingCursor = this.#encodeCursor(lastRemaining);
		}
		this.#loadingMore = true;
	}

	reset() {
		this.#baseFilterKey = this.#currentFilterKey();
		this.#favouriteItems = [];
		this.#remainingItems = [];
		this.#favouriteCursor = null;
		this.#remainingCursor = null;
		this.#favouriteHasMore = false;
		this.#remainingHasMore = false;
		this.#favouritesComplete = false;
		this.#loadingMore = false;
	}

	#resetIfBaseFilterChanged() {
		if (this.#currentFilterKey() !== this.#baseFilterKey) {
			this.reset();
		}
	}

	#currentFilterKey() {
		return stableStringify({
			filter: this.#getBaseFilter(),
			prioritizeFavourites: this.#getPrioritizeFavourites()
		});
	}
}

function dedupeById<T extends RowWithId>(items: readonly T[]) {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (seen.has(item.id)) {
			return false;
		}
		seen.add(item.id);
		return true;
	});
}

function haveSameIds<T extends RowWithId>(left: readonly T[], right: readonly T[]) {
	if (left.length !== right.length) return false;
	const leftIds = new Set(left.map((item) => item.id));
	return right.every((item) => leftIds.has(item.id));
}

function stableStringify(value: unknown) {
	return JSON.stringify(value, (_key, item) => {
		if (!isPlainObject(item)) {
			return item;
		}
		return Object.keys(item)
			.sort((a, b) => a.localeCompare(b))
			.reduce<Record<string, unknown>>((acc, key) => {
				acc[key] = item[key];
				return acc;
			}, {});
	});
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
