import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the person table
// it should return true if the user is a member of the organization of the tag
// it should return false otherwise

export function whatsappTemplateReadPermissions(
	builder: ExpressionBuilder<'whatsappTemplate', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs),
		cmp('teamId', 'IN', ctx.authTeams)
	];

	return or(...filterArr);
}
