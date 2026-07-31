import type { ExpressionBuilder } from '@rocicorp/zero';

import type { QueryContext, Schema } from '$lib/zero/schema';

export function memberFavouriteReadPermissions(
	builder: ExpressionBuilder<'memberFavourite', Schema>,
	ctx: QueryContext
) {
	const { and, cmp, exists } = builder;
	return and(
		cmp('organizationId', 'IN', [...ctx.adminOrgs, ...ctx.ownerOrgs, ...ctx.otherOrgs]),
		exists('member', (member) => member.where('userId', '=', ctx.userId ?? ''))
	);
}
