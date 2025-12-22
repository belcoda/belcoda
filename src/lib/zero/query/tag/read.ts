import { syncedQueryWithContext } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { type InferOutput, object } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';
import { readTagZero } from '$lib/schema/tag';
export const inputSchema = object({
	tagId: uuid
});

export function readTagQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.tag
		.where('id', '=', input.tagId)
		.where((expr) => tagReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readTag = syncedQueryWithContext(
	'readTag',
	parseSchema(inputSchema),
	(ctx: QueryContext, { tagId }) => {
		return readTagQuery({ ctx, input: { tagId } });
	}
);

export const outputSchema = readTagZero;
export type ReadTagOutput = InferOutput<typeof outputSchema>;
