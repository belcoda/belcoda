import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { readOrganizationZero } from '$lib/schema/organization';
export const inputSchema = object({
	organizationId: uuid
});

export function readOrganizationQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.organization
		.where('id', '=', input.organizationId)
		.related('memberships')
		.where((expr) => organizationReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readOrganization = defineQuery(inputSchema, ({ ctx, args }) => {
	return readOrganizationQuery({ ctx, input: { organizationId: args.organizationId } });
});

export const outputSchema = readOrganizationZero;
