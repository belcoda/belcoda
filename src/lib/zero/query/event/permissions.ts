import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the event table
// it should return true if the event is published
// it should return true if the user is the point person of the event
// it should return true if the user is a member of the team of the event
// it should return true if the user is an admin of the organization of the event
// it should return true if the user is an owner of the organization of the event
// it should return false otherwise

export function eventReadPermissions(
	builder: ExpressionBuilder<'event', Schema>,
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
