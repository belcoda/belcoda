import { defineQuery } from '@rocicorp/zero';
import { builder, type QueryContext } from '$lib/zero/schema';
import { object, type InferOutput, optional } from 'valibot';
import { uuid, count } from '$lib/schema/helpers';
import { activityReadPermissions } from '$lib/zero/query/activity/permissions';
import { readActivityZero } from '$lib/schema/activity';

export const inputSchema = object({
	personId: uuid,
	limit: optional(count)
});

export type ListActivityInput = InferOutput<typeof inputSchema>;

export function listActivityQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const limit = input.limit ?? 20;
	const q = builder.activity
		.where('personId', '=', input.personId)
		.where((expr) => activityReadPermissions(expr, ctx))
		.orderBy('createdAt', 'desc')
		.limit(limit);
	return q;
}

export const listActivity = defineQuery(inputSchema, ({ args, ctx }) => {
	return listActivityQuery({ ctx, input: args });
});

export const outputSchema = readActivityZero;
