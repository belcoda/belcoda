import { syncedQueryWithContext } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, object, type InferOutput } from 'valibot';
import { parseSchema, listFilter } from '$lib/schema/helpers';
import { readOrganizationZero } from '$lib/schema/organization';

export const inputSchema = object({});

export function listOrganizationsQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.organization
		.related('memberships')
		.where((expr) => organizationReadPermissions(expr, ctx));
	return q;
}

export const listOrganizations = syncedQueryWithContext(
	'listOrganizations',
	parseSchema(inputSchema),
	(ctx: QueryContext, params) => {
		return listOrganizationsQuery({ ctx, input: params });
	}
);

export const outputSchema = array(readOrganizationZero);
