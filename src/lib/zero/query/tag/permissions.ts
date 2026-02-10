import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// it should return a boolean expression that is used to filter the person table
// it should return true if the user is a member of the organization of the tag
// it should return false otherwise

export function tagReadPermissions(builder: ExpressionBuilder<'tag', Schema>, ctx: QueryContext) {
	const { and, or, cmp, exists } = builder;
	return exists('organization', (m) => {
		return m.whereExists('memberships', (m) => {
			return m.where('userId', '=', ctx.userId);
		});
	});
}
