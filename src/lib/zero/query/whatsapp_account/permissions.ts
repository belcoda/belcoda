import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';

// Returns a boolean expression used to filter the whatsapp_account table for reads.
//
// The `whatsapp_account.referenceId` column is polymorphic:
//   - for `organization` scope it is the owning organization's id
//   - for `user` scope it is the owning user's id
//
// Read rules:
//   1. Organization-scoped accounts are readable by any member of the owning
//      organization.
//   2. User-scoped accounts are readable by any member who shares at least one
//      organization with the owning user (i.e. the owning user is a member of an
//      organization that the caller is also a member of). This includes the
//      owning user themselves, since they always share their own organizations.
export function whatsappAccountReadPermissions(
	builder: ExpressionBuilder<'whatsappAccount', Schema>,
	ctx: QueryContext
) {
	const { and, or, cmp, exists } = builder;
	// every organization the caller is a member of, regardless of role
	const memberOrgs = [...ctx.adminOrgs, ...ctx.ownerOrgs, ...ctx.otherOrgs];

	return or(
		// organization-scoped: caller is a member of the owning organization
		and(cmp('scope', '=', 'organization'), cmp('referenceId', 'IN', memberOrgs)),
		// user-scoped: the caller is the owning user (always allowed to read their own account)
		and(cmp('scope', '=', 'user'), cmp('referenceId', '=', ctx.userId ?? '')),
		// user-scoped: the owning user belongs to an organization the caller also belongs to.
		// We join through the polymorphic `referenceId -> user` relationship and then check
		// that user's memberships against the caller's organizations.
		and(
			cmp('scope', '=', 'user'),
			exists('user', (u) =>
				u.whereExists('orgMemberships', (m) => m.where('organizationId', 'IN', memberOrgs))
			)
		)
	);
}
