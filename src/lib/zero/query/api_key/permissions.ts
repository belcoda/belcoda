import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the api_key table
// it should return true if the user is the user that created the api key
// it should return true if the user is an admin or owner of the organization that the api key is for
// it should return false otherwise

export function apiKeyReadPermissions(
	builder: ExpressionBuilder<Schema, 'apiKey'>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('userId', '=', ctx.userId),
		exists('user', (m) => {
			return m.whereExists('orgMemberships', (om) => {
				return om.where(({ or, cmp }) =>
					or(cmp('organizationId', 'IN', ctx.adminOrgs), cmp('organizationId', 'IN', ctx.ownerOrgs))
				);
			});
		})
	];

	return or(...filterArr);
}
