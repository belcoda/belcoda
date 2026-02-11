import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { personReadPermissions } from '$lib/zero/query/person/permissions';

// it should return a boolean expression that is used to filter the person_import table
// it should return true if the user is an admin or owner of the organization that the person import happened in
// it should return false otherwise

export function personNoteReadPermissions(
	builder: ExpressionBuilder<'personNote', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs),
		cmp('userId', '=', ctx.userId),
		exists('person', (p) => {
			return p.where((pBuilder) => personReadPermissions(pBuilder, ctx));
		})
	];

	return or(...filterArr);
}
