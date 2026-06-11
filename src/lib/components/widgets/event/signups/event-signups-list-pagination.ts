let resetPagination: (() => void) | null = null;

export function registerEventSignupsListPaginationReset(reset: () => void) {
	resetPagination = reset;
}

export function unregisterEventSignupsListPaginationReset() {
	resetPagination = null;
}

export function resetEventSignupsListPagination() {
	resetPagination?.();
}
