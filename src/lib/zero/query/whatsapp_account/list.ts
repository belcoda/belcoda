import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, omit, boolean, optional } from 'valibot';
import { listFilter } from '$lib/schema/helpers';
import { whatsappAccountReadPermissions } from '$lib/zero/query/whatsapp_account/permissions';
import { readWhatsappAccountZero } from '$lib/schema/whatsapp-account';

export const inputSchema = omit(
	object({
		...listFilter.entries,
		limitToCurrentUser: optional(boolean())
	}),
	['teamId', 'pageSize', 'cursor', 'excludedIds', 'searchString']
);
export type ListWhatsappAccountsInput = InferOutput<typeof inputSchema>;

export function listWhatsappAccountsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.whatsappAccount
		// security boundary: only rows the caller is allowed to read
		.where((expr) => whatsappAccountReadPermissions(expr, ctx))
		// view scoping: restrict to accounts belonging to the requested organization,
		// i.e. the organization's own account plus the accounts of its members
		.where((expr) => inOrganizationScope(expr, ctx, input.organizationId))
		.where((expr) => whereClause(expr, { filter: input, ctx }))
		.orderBy('createdAt', 'desc');

	return q;
}

export const listWhatsappAccounts = defineQuery(inputSchema, ({ ctx, args }) => {
	return listWhatsappAccountsQuery({ ctx, input: args });
});

// Restrict the result set to a single organization "view":
//   - organization-scoped accounts whose referenceId is this organization
//   - user-scoped accounts whose owner is a member of this organization
//
// `organizationId` is client-supplied and must not be trusted on its own: without
// verifying the caller is actually a member of it, a caller could pass an org they
// don't belong to and use the user-scoped branch below to infer/list accounts of
// users they share a *different* org with, scoped to this unrelated org (a
// cross-org membership inference leak). So we first confirm the caller is a
// member of `organizationId`; if not, the query is short-circuited to return no
// rows via an unsatisfiable `id IN []` predicate (same pattern relied on for
// empty-array `IN` in permissions.ts).
function inOrganizationScope(
	builder: ExpressionBuilder<'whatsappAccount', Schema>,
	ctx: QueryContext,
	organizationId: string
) {
	const { and, or, cmp, exists } = builder;
	const memberOrgs = [...ctx.adminOrgs, ...ctx.ownerOrgs, ...ctx.otherOrgs];
	if (!memberOrgs.includes(organizationId)) {
		return cmp('id', 'IN', []);
	}
	return or(
		and(cmp('scope', '=', 'organization'), cmp('referenceId', '=', organizationId)),
		and(
			cmp('scope', '=', 'user'),
			exists('user', (u) =>
				u.whereExists('orgMemberships', (m) => m.where('organizationId', '=', organizationId))
			)
		)
	);
}

function whereClause(
	builder: ExpressionBuilder<'whatsappAccount', Schema>,
	{ filter, ctx }: { filter: ListWhatsappAccountsInput; ctx: QueryContext }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp } = builder;
	const filterArr = [cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null)];
	if (filter.limitToCurrentUser && ctx.userId) {
		filterArr.push(cmp('referenceId', '=', ctx.userId));
	}
	return and(...filterArr);
}

export const outputSchema = array(readWhatsappAccountZero);
