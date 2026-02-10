import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
// it should return a boolean expression that is used to filter the whatsapp_group table
// it should return true if the user is the point person of the whatsapp group
// it should return true if the user is a member of the team that the whatsapp group is a member of
// it should return true if the user is an admin or owner of the organization of the whatsapp group
// it should return false otherwise

export function whatsappGroupReadPermissions(
	builder: ExpressionBuilder<'whatsappGroup', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('teamId', 'IN', ctx.authTeams),
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	];

	return or(...filterArr);
}
