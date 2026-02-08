import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the person table
// it should return true if the user is the point person of the person
// it should return true if the user is a member of the team of the person
// it should return true if the user is an admin of the organization of the person
// it should return true if the user is an owner of the organization of the person
// it should return false otherwise

export function personReadPermissions(
	builder: ExpressionBuilder<'person', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		or(
			exists('teams', (t) => {
				return t.where('id', 'IN', ctx.authTeams);
			}),
			cmp('organizationId', 'IN', ctx.adminOrgs),
			cmp('organizationId', 'IN', ctx.ownerOrgs)
		)
	];

	return and(...filterArr);
}
