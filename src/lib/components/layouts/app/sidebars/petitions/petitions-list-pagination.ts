let resetPagination: (() => void) | null = null;

export function registerPetitionsListPaginationReset(reset: () => void) {
	resetPagination = reset;
}

export function unregisterPetitionsListPaginationReset() {
	resetPagination = null;
}

export function resetPetitionsListPagination() {
	resetPagination?.();
}
