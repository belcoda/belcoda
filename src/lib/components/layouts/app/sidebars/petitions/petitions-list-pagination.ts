import { getContext, setContext } from 'svelte';

const PETITIONS_LIST_PAGINATION_KEY = Symbol('petitionsListPagination');

export type PetitionsListPaginationContext = {
	reset: () => void;
};

export function setPetitionsListPaginationContext(ctx: PetitionsListPaginationContext) {
	setContext(PETITIONS_LIST_PAGINATION_KEY, ctx);
}

export function resetPetitionsListPagination() {
	getContext<PetitionsListPaginationContext | undefined>(PETITIONS_LIST_PAGINATION_KEY)?.reset();
}
