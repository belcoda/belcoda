import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { flowDocumentReadPermissions } from '$lib/zero/query/flow_document/permissions';

export const inputSchema = object({
	flowDocumentId: uuid
});

// The editor's primary reactive read: the draft graph it binds to lives on this row.
export function readFlowDocumentQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.flowDocument
		.where('id', '=', input.flowDocumentId)
		.where('deletedAt', 'IS', null)
		.where((expr) => flowDocumentReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readFlowDocument = defineQuery(inputSchema, ({ ctx, args }) => {
	return readFlowDocumentQuery({ ctx, input: args });
});

export { readFlowDocumentZero as outputSchema } from '$lib/schema/flow/document';
