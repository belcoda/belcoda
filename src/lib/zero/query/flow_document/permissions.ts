import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// Returns a boolean expression used to filter the flow_document table. Same shape as the flow
// resource: visible to the document's team members, or org admins/owners.
export function flowDocumentReadPermissions(
	builder: ExpressionBuilder<'flowDocument', Schema>,
	ctx: QueryContext
) {
	const { or, cmp } = builder;
	return or(
		cmp('teamId', 'IN', ctx.authTeams),
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	);
}
