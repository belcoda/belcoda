import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, nullable, optional, picklist } from 'valibot';
import { listFilter, parseSchema, uuid } from '$lib/schema/helpers';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { readPetitionZero } from '$lib/schema/petition/petition';

export const inputSchema = object({
	...listFilter.entries,
	status: optional(nullable(picklist(['draft', 'published', 'archived'])))
});
export type PetitionListFilter = InferOutput<typeof inputSchema>;

export function listPetitionsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.petition
		.where((expr) => petitionReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listPetitions = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPetitionsQuery({ ctx, input: args });
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
