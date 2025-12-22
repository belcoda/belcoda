import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the member table
// it should return true if the user is a member of the organization
// it should return false otherwise

export function memberReadPermissions(
	builder: ExpressionBuilder<Schema, 'member'>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		exists('organization', (t) => {
			return t.whereExists('memberships', (m) => {
				return m.where(({ and, cmp }) => {
					return and(cmp('userId', '=', ctx.userId));
				});
			});
		})
	];

	return and(...filterArr);
}
