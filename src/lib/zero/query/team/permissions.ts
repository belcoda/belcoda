import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the person table
// it should return true if the user is a member of the team
// it should return true if the user is an admin or owner of the organization of the team
// it should return false otherwise

export function teamReadPermissions(builder: ExpressionBuilder<'team', Schema>, ctx: QueryContext) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	];

	if (ctx.userId) {
		filterArr.push(
			exists('user', (m) => {
				return m.where('userId', '=', ctx.userId!);
			})
		);
	}

	return or(...filterArr);
}
