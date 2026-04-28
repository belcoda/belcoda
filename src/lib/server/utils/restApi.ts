import { error } from '@sveltejs/kit';
import { getApiQueryContext } from '$lib/server/api/utils/auth/permissions';
import { type QueryContext } from '$lib/zero/schema';
/**
 * Checks if the provided `organizationIdDerivedFromApiKey` is a valid organization ID.
 *
 * Throws a 401 error if `organizationIdDerivedFromApiKey` is null or undefined.
 *
 * Returns the query context for the API route if the organizationIdDerivedFromApiKey is valid.
 *
 * 💣 NOTE: Do NOT catch this error in the route handler. It should bubble up to the SvelteKit error handler.
 *
 * @param organizationIdDerivedFromApiKey - The organization ID derived from the API key, or null if unauthorized.
 * @returns The query context for the API route.
 * @throws {import('@sveltejs/kit').HttpError} If the organizationId is not present (unauthorized).
 */
export function safeApiRouteQueryContext(
	organizationIdDerivedFromApiKey: string | null
): QueryContext {
	if (!organizationIdDerivedFromApiKey) {
		throw error(401, {
			message: 'Unauthorized: Attempted to access API route without a valid API key'
		});
	}
	return getApiQueryContext(organizationIdDerivedFromApiKey);
}

import type { ListFilter } from '$lib/schema/helpers';

export function buildApiListQueryFromUrl({
	organizationId,
	url
}: {
	organizationId: string;
	url: URL;
}): ListFilter {
	// set max page size to 100
	const pageSizeParam = url.searchParams.get('pageSize');
	const pageSizeParsed = parseInt(pageSizeParam ?? '25', 10);
	const pageSize = Math.min(Number.isNaN(pageSizeParsed) ? 25 : pageSizeParsed, 100);
	return {
		organizationId,
		pageSize,
		searchString: url.searchParams.get('search') || null,
		teamId: null,
		isDeleted: null,
		startAfter: url.searchParams.get('startAfter') || null,
		excludedIds: []
	};
}

export const queryParamsOpenAPIDefinition = {
	pageSize: {
		name: 'pageSize',
		in: 'query',
		required: false,
		schema: {
			type: 'number',
			minimum: 1,
			maximum: 100
		},
		description: 'The number of items to return per page. Maximum 100.'
	},
	searchString: {
		name: 'search',
		in: 'query',
		required: false,
		schema: {
			type: 'string'
		},
		description: 'A string to search for. Searching is by the name of the resource.'
	},
	startAfter: {
		name: 'startAfter',
		in: 'query',
		required: false,
		schema: {
			type: 'string'
		},
		description:
			'The ID of the last item in the previous page. Used for pagination. The value of this parameter should be the value of the `id` field of the last item in the previous page.'
	}
};
