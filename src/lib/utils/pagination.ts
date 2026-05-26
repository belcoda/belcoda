export type PaginationMode = 'button' | 'infinite';

export const COMMUNITY_PAGINATION_MODE: PaginationMode =
	import.meta.env.PUBLIC_COMMUNITY_PAGINATION_MODE === 'infinite' ? 'infinite' : 'button';
