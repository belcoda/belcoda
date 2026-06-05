let resetPagination: (() => void) | null = null;

export function registerPetitionSignaturesListPaginationReset(reset: () => void) {
	resetPagination = reset;
}

export function unregisterPetitionSignaturesListPaginationReset() {
	resetPagination = null;
}

export function resetPetitionSignaturesListPagination() {
	resetPagination?.();
}
