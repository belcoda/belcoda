import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the person table
// it should return true if the user is a member of the team
// it should return true if the user is an admin or owner of the organization of the team
// it should return false otherwise

export function teamReadPermissions(builder: ExpressionBuilder<'team', Schema>, ctx: QueryContext) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		exists('user', (m) => {
			return m.where('userId', '=', ctx.userId);
		}),
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	];

	return or(...filterArr);
}
