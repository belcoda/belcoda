import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object } from 'valibot';
import { listFilter, parseSchema } from '$lib/schema/helpers';
import { personImportReadPermissions } from '$lib/zero/query/person_import/permissions';
import { readPersonImportZero } from '$lib/schema/person-import';

export const inputSchema = object({
	...listFilter.entries
});
export type ListPersonImportsInput = InferOutput<typeof inputSchema>;

export function listPersonImportsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.personImport
		.where((expr) => personImportReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.related('importedByPerson')
		.orderBy('createdAt', 'desc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listPersonImports = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPersonImportsQuery({ ctx, input: args });
});

export const outputSchema = array(readPersonImportZero);
