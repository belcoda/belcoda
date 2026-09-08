import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// Returns a boolean expression used to filter the flow_execution table. flow_execution has no
// teamId column of its own, so team-member access is granted by joining through the owning
// flow_document (whose team the execution belongs to). A row is visible when:
// - the user is an admin of the execution's organization, or
// - the user is an owner of the execution's organization, or
// - the user is a member of the owning flow_document's team.
export function flowExecutionReadPermissions(
	builder: ExpressionBuilder<'flowExecution', Schema>,
	ctx: QueryContext
) {
	const { or, cmp, exists } = builder;
	return or(
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs),
		exists('flowDocument', (d) => d.where('teamId', 'IN', ctx.authTeams))
	);
}
