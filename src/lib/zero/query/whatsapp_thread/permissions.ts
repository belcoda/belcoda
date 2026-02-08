import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the whatsapp_thread table
// it should return true if the user is a an admin or owner of the organization of the whatsapp thread
// it should return false otherwise

export function whatsappThreadReadPermissions(
	builder: ExpressionBuilder<'whatsappThread', Schema>,
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
