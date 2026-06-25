import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

export function notificationReadPermissions(
	builder: ExpressionBuilder<'notification', Schema>,
	ctx: QueryContext
) {
	const { and, cmp, exists } = builder;
	return and(
		exists('organization', (o) => {
			return o.where(({ or, cmp }) => {
				return or(
					cmp('id', 'IN', ctx.adminOrgs),
					cmp('id', 'IN', ctx.ownerOrgs),
					cmp('id', 'IN', ctx.otherOrgs)
				);
			});
		}),
		cmp('userId', '=', ctx.userId ?? '')
	);
}
