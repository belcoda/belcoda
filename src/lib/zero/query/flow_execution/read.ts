import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { flowExecutionReadPermissions } from '$lib/zero/query/flow_execution/permissions';

export const inputSchema = object({
	flowExecutionId: uuid
});

export function readFlowExecutionQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.flowExecution
		.where('id', '=', input.flowExecutionId)
		.where((expr) => flowExecutionReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readFlowExecution = defineQuery(inputSchema, ({ ctx, args }) => {
	return readFlowExecutionQuery({ ctx, input: args });
});

export { readFlowExecutionZero as outputSchema } from '$lib/schema/flow/execution';
