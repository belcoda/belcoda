import { getContext, setContext } from 'svelte';

const PETITION_SIGNATURES_LIST_PAGINATION_KEY = Symbol('petitionSignaturesListPagination');

export type PetitionSignaturesListPaginationContext = {
	reset: () => void;
};

export function setPetitionSignaturesListPaginationContext(
	ctx: PetitionSignaturesListPaginationContext
) {
	setContext(PETITION_SIGNATURES_LIST_PAGINATION_KEY, ctx);
}

export function resetPetitionSignaturesListPagination() {
	getContext<PetitionSignaturesListPaginationContext | undefined>(
		PETITION_SIGNATURES_LIST_PAGINATION_KEY
	)?.reset();
}
