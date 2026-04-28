import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the member table
// it should return true if the user is a member of the organization
// it should return false otherwise

export function memberReadPermissions(
	builder: ExpressionBuilder<'member', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		exists('organization', (t) => {
			return t.where(({ or, cmp }) => {
				return or(
					cmp('id', 'IN', ctx.adminOrgs),
					cmp('id', 'IN', ctx.ownerOrgs),
					cmp('id', 'IN', ctx.otherOrgs)
				);
			});
		})
	];
	if (ctx.userId) {
		filterArr.push(cmp('userId', '=', ctx.userId!));
	}

	return and(...filterArr);
}
