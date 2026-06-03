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

/**
 * Paginated person note list. Fetches one row past `input.pageSize` (default 50) so callers can
 * detect a next page without a separate count query. Trim before display: keep at most
 * `input.pageSize` rows and treat any extra as `hasMore` (see `processPage` in
 * `$lib/state/paginated-zero-list.svelte.ts`, used by the person notes drawer).
 */
export function listPersonNotesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = (input.pageSize || 50) + 1;
	let q = builder.personNote
		.where((expr) => personNoteReadPermissions(expr, ctx))
		.related('user', (expr) => expr.one())
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(pageSize);
	if (input.cursor) {
		const cursor = decodePersonNoteListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

export const listPersonNotes = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPersonNotesQuery({ ctx, input: args });
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
