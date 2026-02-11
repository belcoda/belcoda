import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { type InferOutput, object } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';
import { readTagZero } from '$lib/schema/tag';
export const inputSchema = object({
	tagId: uuid
});

export function readTagQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.tag
		.where('id', '=', input.tagId)
		.where((expr) => tagReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readTag = defineQuery(inputSchema, ({ ctx, args }) => {
	return readTagQuery({ ctx, input: args });
});

export const outputSchema = readTagZero;
export type ReadTagOutput = InferOutput<typeof outputSchema>;
