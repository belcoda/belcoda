import { defineQuery } from '@rocicorp/zero';
import { builder, type QueryContext } from '$lib/zero/schema';
import { object, optional, type InferOutput, boolean } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { activityReadPermissions } from '$lib/zero/query/activity/permissions';
import { decodeActivityListCursor } from '$lib/utils/activity/cursor';

const DEFAULT_PAGE_SIZE = 20;

export const inputSchema = object({
	personId: uuid,
	accountId: optional(uuid),
	onlyShowWhatsappMessages: optional(boolean()),
	cursor: listFilter.entries.cursor,
	pageSize: listFilter.entries.pageSize
});

export type ListActivityInput = InferOutput<typeof inputSchema>;

function listActivityQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.activity
		.where('personId', '=', input.personId)
		.where((expr) => activityReadPermissions(expr, ctx))
		// A deleted note leaves its note_added activity behind (soft delete, not a real
		// removal), which would otherwise render as an empty timeline row and could leave
		// a date divider with nothing under it. Exclude it here rather than downstream in
		// the component, so it never consumes a pagination slot either.
		.where((expr) => {
			const { or, cmp, exists } = expr;
			return or(
				cmp('type', '!=', 'note_added'),
				exists('personNote', (n) => n.where('deletedAt', 'IS', null))
			);
		})
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodeActivityListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	if (input.onlyShowWhatsappMessages) {
		q = q.where('type', 'IN', ['whatsapp_message_incoming', 'whatsapp_message_outgoing']);
	}
	if (input.accountId) {
		const accountId = input.accountId;
		q = q.where((expr) => {
			const { or, exists, cmp } = expr;
			return or(
				exists('whatsappMessage', (m) => m.where('whatsappAccountId', '=', accountId)),
				// Notes are about the person, not any one WhatsApp number, so they stay
				// visible in every account tab rather than only the one active when saved.
				cmp('type', '=', 'note_added')
			);
		});
	}
	return q;
}

// Exact page size for REST and other non-UI callers
export function listActivityQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || DEFAULT_PAGE_SIZE;
	return listActivityQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listActivityPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || DEFAULT_PAGE_SIZE;
	return listActivityQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listActivity = defineQuery(inputSchema, ({ args, ctx }) => {
	return listActivityPaginatedQuery({ ctx, input: args });
});

export { readActivityZero as outputSchema } from '$lib/schema/activity';
