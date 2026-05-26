import { PUBLIC_COMMUNITY_PAGINATION_MODE } from '$env/static/public';

export type PaginationMode = 'button' | 'infinite';

export const COMMUNITY_PAGINATION_MODE: PaginationMode =
	PUBLIC_COMMUNITY_PAGINATION_MODE === 'infinite' ? 'infinite' : 'button';
