import { error, type RequestEvent, json } from '@sveltejs/kit';
import { getApiQueryContext } from '$lib/server/api/utils/auth/permissions';
import { type BaseSchema, type BaseIssue, parse } from 'valibot';
import { type QueryContext } from '$lib/zero/schema';
import { renderValiError } from '$lib/schema/helpers';
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
export function safeApiRouteQueryContext(organizationIdDerivedFromApiKey: string | null): {
	ctx: QueryContext;
	organizationId: string;
} {
	if (!organizationIdDerivedFromApiKey) {
		throw error(401, {
			message: 'Unauthorized: Attempted to access API route without a valid API key'
		});
	}
	return {
		ctx: getApiQueryContext(organizationIdDerivedFromApiKey),
		organizationId: organizationIdDerivedFromApiKey
	};
}

import type { ListFilter } from '$lib/schema/helpers';

export function buildApiListFilter({
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
		startAfter: url.searchParams.get('startAfter') || null, //Note: Currently ignored due to potential bug in Z2S compiler not yet supporting pagination
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

export function buildApiErrorResponse(error: unknown): Response {
	const valiError = renderValiError(error);
	if (valiError.isValiError) {
		return json({ error: valiError.message }, { status: 400 });
	} else {
		return json({ error: 'An unknown error occurred' }, { status: 500 });
	}
}

export function buildApiListResponse<T>({ data, count }: { data: T; count: number }) {
	return {
		metadata: {
			count
		},
		data
	};
}

export async function processIncomingBody<T>(
	event: RequestEvent,
	schema: BaseSchema<unknown, T, BaseIssue<unknown>>
): Promise<T> {
	let body: unknown;
	try {
		body = await event.request.json();
	} catch (err) {
		throw error(400, {
			message: 'Invalid JSON body'
		});
	}
	if (!body) {
		throw error(400, {
			message: 'No body provided'
		});
	}
	try {
		return parse(schema, body);
	} catch (err) {
		throw buildApiErrorResponse(err);
	}
}

export function processOutgoingBody<T, U>(
	body: T,
	schema: BaseSchema<T, U, BaseIssue<unknown>>
): U {
	try {
		const parsed = parse(schema, body);
		return parsed;
	} catch (err) {
		throw buildApiErrorResponse(err);
	}
}
