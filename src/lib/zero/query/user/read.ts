import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { userReadPermissions } from '$lib/zero/query/user/permissions';
import { readUserZero } from '$lib/schema/user';

export const inputSchema = object({
	userId: uuid
});

export function readUserQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.user
		.where('id', '=', input.userId)
		.where((expr) => userReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readUser = defineQuery(inputSchema, ({ ctx, args }) => {
	return readUserQuery({ ctx, input: args });
});

export const outputSchema = readUserZero;
