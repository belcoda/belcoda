import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { webhookReadPermissions } from '$lib/zero/query/webhook/permissions';

// it should return a boolean expression that is used to filter the webhook_log table
// it should return true if the user is an admin or owner of the organization of the webhook that the webhook_log is for
// it should return false otherwise

export function webhookLogReadPermissions(
	builder: ExpressionBuilder<'webhookLog', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		exists('webhook', (w) => {
			return w.where((wBuilder) => webhookReadPermissions(wBuilder, ctx));
		})
	];

	return and(...filterArr);
}
