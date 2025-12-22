import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { personReadPermissions } from '$lib/zero/query/person/permissions';

// it should return a boolean expression that is used to filter the person_tag table which is a junction table between person and tag
// it should return true for any person that the user is a point person of
// it should return true for any person in any team that the user is a member of
// it should return true for any person in any organization that the user is an admin or owner of
// it should return false otherwise

export function personTagReadPermissions(
	builder: ExpressionBuilder<Schema, 'personTag'>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		exists('person', (p) => {
			return p.where((pBuilder) => personReadPermissions(pBuilder, ctx));
		})
	];

	return and(...filterArr);
}
