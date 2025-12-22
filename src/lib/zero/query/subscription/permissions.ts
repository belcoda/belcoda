import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the subscription table
// it should return true if the user is an admin or owner of the organization that the subscription is for
// it should return false otherwise

export function subscriptionReadPermissions(
	builder: ExpressionBuilder<Schema, 'subscription'>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [cmp('referenceId', 'IN', ctx.ownerOrgs)];

	return or(...filterArr);
}
