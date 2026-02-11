import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
// it should return a boolean expression that is used to filter the member table
// it should return true if the user is a member of the team
// it should return true if the user is an admin or owner of the organization of the team
// it should return false otherwise

export function teamMemberReadPermissions(
	builder: ExpressionBuilder<'teamMember', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		exists('team', (t) => {
			return t.where((tBuilder) => teamReadPermissions(tBuilder, ctx));
		})
	];

	return and(...filterArr);
}
