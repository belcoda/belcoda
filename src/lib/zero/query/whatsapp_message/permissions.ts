import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the whatsapp_message table
// it should return true if the user is an admin or owner of the organization of the whatsapp message
// it should return false otherwise

export function whatsappMessageReadPermissions(
	builder: ExpressionBuilder<'whatsappMessage', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs),
		cmp('organizationId', 'IN', ctx.otherOrgs), //We ideally would want to limit this to people that the user has access to,
		cmp('userId', '=', ctx.userId)
	];

	return or(...filterArr);
}
