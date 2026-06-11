import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { type InferOutput, object } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { personNoteReadPermissions } from '$lib/zero/query/person_note/permissions';
import { decodePersonNoteListCursor } from '$lib/utils/person-note/cursor';

export const inputSchema = object({
	organizationId: listFilter.entries.organizationId,
	isDeleted: listFilter.entries.isDeleted,
	searchString: listFilter.entries.searchString,
	cursor: listFilter.entries.cursor,
	pageSize: listFilter.entries.pageSize,
	personId: uuid
});
export type ListPersonNotesInput = InferOutput<typeof inputSchema>;

function listPersonNotesQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.personNote
		.where((expr) => personNoteReadPermissions(expr, ctx))
		.related('user', (expr) => expr.one())
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodePersonNoteListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listPersonNotesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPersonNotesQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listPersonNotesPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPersonNotesQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listPersonNotes = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPersonNotesPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'personNote', Schema>,
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
