import { syncedQueryWithContext, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, object } from 'valibot';
import { listFilter, parseSchema, uuid } from '$lib/schema/helpers';
import { personNoteReadPermissions } from '$lib/zero/query/person_note/permissions';
import { readPersonNoteWithUserZero } from '$lib/schema/person-note';

export const inputSchema = object({
	organizationId: listFilter.entries.organizationId,
	isDeleted: listFilter.entries.isDeleted,
	searchString: listFilter.entries.searchString,
	startAfter: listFilter.entries.startAfter,
	pageSize: listFilter.entries.pageSize,
	personId: uuid
});
export type ListPersonNotesInput = InferOutput<typeof inputSchema>;

export function listPersonNotesQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.personNote
		.where((expr) => personNoteReadPermissions(expr, ctx))
		.related('user', (expr) => expr.one())
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listPersonNotes = syncedQueryWithContext(
	'listPersonNotes',
	parseSchema(inputSchema),
	(ctx: QueryContext, filter) => {
		return listPersonNotesQuery({ ctx, input: filter });
	}
);

function whereClause(
	builder: ExpressionBuilder<Schema, 'personNote'>,
	{ filter }: { filter: ListPersonNotesInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp } = builder;
	const filterArr = [
		cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null),
		cmp('personId', '=', filter.personId)
	];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('note', 'ILIKE', `%${filter.searchString}%`));
	}
	return and(...filterArr);
}
