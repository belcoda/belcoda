import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';

// it should return a boolean expression that is used to filter the person_team table which is a junction table between person and team
// it should return true for any person that the user is a point person of
// it should return true for any team that the user is a member of
// it should return true if the user is an admin or owner of the organization of the team that the person is a member of
// it should return false otherwise

export function personTeamReadPermissions(
	builder: ExpressionBuilder<Schema, 'personTeam'>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	const filterArr = [
		exists('person', (p) => {
			return p.where((pBuilder) => personReadPermissions(pBuilder, ctx));
		}),
		exists('team', (t) => {
			return t.where((tBuilder) => teamReadPermissions(tBuilder, ctx));
		})
	];

	return and(...filterArr);
}
