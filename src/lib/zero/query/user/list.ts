import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, nullable, object, optional } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { userReadPermissions } from '$lib/zero/query/user/permissions';
import { readUserZero } from '$lib/schema/user';

export const inputSchema = object({
	...listFilter.entries,
	personId: optional(nullable(uuid))
});

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
	if (input.personId) {
		q = q.where(({ or, exists }) =>
			or(
				exists('orgMemberships', (m) => {
					return m
						.where('organizationId', '=', input.organizationId)
						.where(({ or, cmp }) => or(cmp('role', '=', 'admin'), cmp('role', '=', 'owner')));
				}),
				exists('teamMemberships', (tm) => {
					return tm.whereExists('team', (team) => {
						return team
							.where('organizationId', '=', input.organizationId)
							.whereExists('person', (pt) => {
								return pt.where('personId', '=', input.personId!);
							});
					});
				})
			)
		);
	}
	if (input.excludedIds?.length) {
		q = q.where(({ cmp }) => cmp('id', 'NOT IN', input.excludedIds));
	}
	if (input.searchString) {
		const search = `%${escapeLikeLiteral(input.searchString)}%`;
		q = q.where(({ or, cmp }) => or(cmp('name', 'ILIKE', search), cmp('email', 'ILIKE', search)));
	}
	q = q.limit(input.pageSize);
	if (input.cursor) {
		q = q.start({ id: input.cursor });
	}
	return q;
}

export const listUsers = defineQuery(inputSchema, ({ ctx, args }) => {
	return listUsersQuery({ ctx, input: args });
});

export const outputSchema = array(readUserZero);

export function escapeLikeLiteral(value: string) {
	return value.replace(/[\\%_]/g, '\\$&');
}
