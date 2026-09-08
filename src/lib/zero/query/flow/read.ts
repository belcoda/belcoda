import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { flowReadPermissions } from '$lib/zero/query/flow/permissions';

export const inputSchema = object({
	flowId: uuid
});

export function readFlowQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.flow
		.where('id', '=', input.flowId)
		.where('deletedAt', 'IS', null)
		.where((expr) => flowReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readFlow = defineQuery(inputSchema, ({ ctx, args }) => {
	return readFlowQuery({ ctx, input: args });
});

export { readFlowResourceZero as outputSchema } from '$lib/schema/flow/flow';
