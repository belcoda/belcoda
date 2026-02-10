import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { readOrganizationZero } from '$lib/schema/organization';
export const inputSchema = object({
	organizationId: uuid
});

export function readOrganizationQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.organization
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
