import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { array, object, type InferOutput } from 'valibot';
import { parseSchema, listFilter } from '$lib/schema/helpers';
import { readOrganizationZero } from '$lib/schema/organization';

export const inputSchema = object({});

export function listOrganizationsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.organization
		.related('memberships')
		.where((expr) => organizationReadPermissions(expr, ctx));
	return q;
}

export const listOrganizations = defineQuery(inputSchema, ({ ctx, args }) => {
	return listOrganizationsQuery({ ctx, input: args });
});

export const outputSchema = array(readOrganizationZero);
