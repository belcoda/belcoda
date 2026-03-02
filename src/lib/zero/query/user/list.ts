import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput } from 'valibot';
import { listFilter, parseSchema } from '$lib/schema/helpers';
import { userReadPermissions } from '$lib/zero/query/user/permissions';
import { readUserZero } from '$lib/schema/user';

export const inputSchema = listFilter;

export function listUsersQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.user
		.where((expr) => userReadPermissions(expr, ctx))
		.where(({ exists }) => {
			return exists('orgMemberships', (m) => {
				return m.whereExists('organization', (o) => {
					return o.where('id', '=', input.organizationId);
				});
			});
		});
	if (input.teamId) {
		q = q.where(({ exists }) => {
			return exists('teamMemberships', (tm) => {
				return tm.where('teamId', '=', input.teamId!);
			});
		});
	}
	if (input.excludedIds?.length) {
		q = q.where(({ cmp }) => cmp('id', 'NOT IN', input.excludedIds));
	}
	q = q.limit(input.pageSize);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listUsers = defineQuery(inputSchema, ({ ctx, args }) => {
	return listUsersQuery({ ctx, input: args });
});

export const outputSchema = array(readUserZero);
