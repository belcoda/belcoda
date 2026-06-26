import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, nullable, optional, picklist } from 'valibot';
import { listFilter, parseSchema } from '$lib/schema/helpers';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { readPetitionZero } from '$lib/schema/petition/petition';
import { decodePetitionListCursor } from '$lib/utils/petition/cursor';

export const inputSchema = object({
	...listFilter.entries,
	status: optional(nullable(picklist(['draft', 'published', 'archived'])))
});
export type PetitionListFilter = InferOutput<typeof inputSchema>;

function listPetitionsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.petition
		.where((expr) => petitionReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodePetitionListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listPetitionsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPetitionsQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listPetitionsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPetitionsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listPetitions = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPetitionsPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'petition', Schema>,
	{ filter }: { filter: InferOutput<typeof inputSchema> }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp } = builder;
	const filterArr = [cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null)];

	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('title', 'ILIKE', `%${filter.searchString}%`));
	}

	if (filter.teamId) {
		filterArr.push(cmp('teamId', '=', filter.teamId!));
	}

	if (filter.status) {
		if (filter.status === 'draft') {
			filterArr.push(cmp('published', '=', false));
			filterArr.push(cmp('archivedAt', 'IS', null));
		} else if (filter.status === 'published') {
			filterArr.push(cmp('published', '=', true));
			filterArr.push(cmp('archivedAt', 'IS', null));
		} else if (filter.status === 'archived') {
			filterArr.push(cmp('archivedAt', 'IS NOT', null));
		}
	} else {
		filterArr.push(cmp('archivedAt', 'IS', null));
	}

	return and(...filterArr);
}

export const outputSchema = array(readPetitionZero);
