import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// Returns a boolean expression used to filter the flow table. A row is visible when:
// - the user is a member of the flow's team, or
// - the user is an admin of the flow's organization, or
// - the user is an owner of the flow's organization.
export function flowReadPermissions(builder: ExpressionBuilder<'flow', Schema>, ctx: QueryContext) {
	const { or, cmp } = builder;
	return or(
		cmp('teamId', 'IN', ctx.authTeams),
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	);
}
