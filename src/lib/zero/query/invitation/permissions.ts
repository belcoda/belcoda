import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the invitation table
// it should return true if the user is the inviter of the invitation
// it should return true if the user is a member of the team of the invitation
// it should return true if the user is an admin or owner of the organization of the invitation
// it should return false otherwise

export function invitationReadPermissions(
	builder: ExpressionBuilder<'invitation', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('inviterId', '=', ctx.userId),
		cmp('teamId', 'IN', ctx.authTeams),
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	];

	return or(...filterArr);
}
