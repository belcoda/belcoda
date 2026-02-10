import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the webhook table
// it should return true if the user is an admin or owner of the organization that the webhook is for
// it should return false otherwise

export function webhookReadPermissions(
	builder: ExpressionBuilder<'webhook', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	];

	return or(...filterArr);
}
