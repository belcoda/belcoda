import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// Returns a boolean expression that is used to filter the petition table
// Returns true if:
// - The user is a member of the team of the petition
// - The user is an admin of the organization of the petition
// - The user is an owner of the organization of the petition
// Returns false otherwise

export function petitionReadPermissions(
	builder: ExpressionBuilder<'petition', Schema>,
	ctx: QueryContext
) {
	const { or, cmp } = builder;
	const filterArr = [
		cmp('teamId', 'IN', ctx.authTeams),
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	];

	return or(...filterArr);
}
