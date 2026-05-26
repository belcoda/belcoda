export function processPage<T>(rows: readonly T[], pageSize: number) {
	const pageItems = rows.slice(0, pageSize);
	return {
		items: pageItems,
		hasMore: rows.length > pageSize
	};
}
