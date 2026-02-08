import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// Returns a boolean expression that is used to filter the petitionSignature table
// Returns true if:
// - The user is a member of the team of the petition signature
// - The user is an admin of the organization of the petition signature
// - The user is an owner of the organization of the petition signature
// Returns false otherwise

export function petitionSignatureReadPermissions(
	builder: ExpressionBuilder<'petitionSignature', Schema>,
	ctx: QueryContext
) {
	const { or, cmp } = builder;
	const filterArr = [
		cmp('teamId', 'IN', ctx.authTeams),
		cmp('organizationId', 'IN', ctx.adminOrgs),
		cmp('organizationId', 'IN', ctx.ownerOrgs)
	];

	return or(...filterArr);
}
