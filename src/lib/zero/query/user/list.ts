import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput } from 'valibot';
import { listFilter, parseSchema } from '$lib/schema/helpers';
import { userReadPermissions } from '$lib/zero/query/user/permissions';
import { readUserZero } from '$lib/schema/user';

export const inputSchema = listFilter;

export function listUsersQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.user
		.where((expr) => userReadPermissions(expr, ctx))
		.where(({ and, or, cmp, exists }) => {
			return exists('orgMemberships', (m) => {
				return m.whereExists('organization', (o) => {
					return o.where('id', '=', input.organizationId);
				});
			});
		})
		.limit(input.pageSize);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listUsers = defineQuery(inputSchema, ({ ctx, args }) => {
	return listUsersQuery({ ctx, input: args });
});

export const outputSchema = array(readUserZero);
