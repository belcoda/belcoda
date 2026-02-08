import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { personReadPermissions } from '$lib/zero/query/person/permissions';

// it should return a boolean expression that is used to filter the activity table
// it should return true if the user is the point person of the person that is the subject of the activity
// it should return true if the user is a member of the team of the person that is the subject of the activity
// it should return true if the user is an admin or owner of the organization of the person that is the subject of the activity
// it should return true if the user is the user that created the activity
// it should return false otherwise

export function activityReadPermissions(
	builder: ExpressionBuilder<'activity', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('userId', '=', ctx.userId),
		exists('person', (p) => {
			return p.where((pBuilder) => personReadPermissions(pBuilder, ctx));
		})
	];

	return or(...filterArr);
}
