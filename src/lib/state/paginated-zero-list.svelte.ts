type RowWithId = {
	id: string;
};

type PaginatedZeroListOptions<TFilter extends Record<string, unknown>, TItem extends RowWithId> = {
	getBaseFilter: () => TFilter;
	encodeCursor: (row: TItem) => string;
	pageSize?: number;
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

function stableStringify(value: unknown) {
	return JSON.stringify(value, (_key, item) => {
		if (!isPlainObject(item)) {
			return item;
		}
		return Object.keys(item)
			.sort()
			.reduce<Record<string, unknown>>((acc, key) => {
				acc[key] = item[key];
				return acc;
			}, {});
	});
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
