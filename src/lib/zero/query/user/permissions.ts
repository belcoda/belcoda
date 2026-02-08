import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the person table
// it should return true if the user is the user itself
// it should return true if the user is a member of the any organization that the user is a member of
// it should return false otherwise

export function userReadPermissions(builder: ExpressionBuilder<'user', Schema>, ctx: QueryContext) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('id', '=', ctx.userId),
		exists('orgMemberships', (m) => {
			return m.whereExists('organization', (o) => {
				return o.whereExists('memberships', (m) => {
					return m.where('userId', '=', ctx.userId);
				});
			});
		})
	];

	return or(...filterArr);
}
