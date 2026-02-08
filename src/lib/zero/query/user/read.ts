import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { userReadPermissions } from '$lib/zero/query/user/permissions';
import { readUserZero } from '$lib/schema/user';

export const inputSchema = object({
	userId: uuid
});

export function readUserQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.user
		.where('id', '=', input.userId)
		.where((expr) => userReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readUser = defineQuery(inputSchema, ({ ctx, args }) => {
	return readUserQuery({ ctx, input: args });
});

export const outputSchema = readUserZero;
