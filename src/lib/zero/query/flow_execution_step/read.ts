import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { flowExecutionStepReadPermissions } from '$lib/zero/query/flow_execution_step/permissions';

export const inputSchema = object({
	flowExecutionStepId: uuid
});

export function readFlowExecutionStepQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.flowExecutionStep
		.where('id', '=', input.flowExecutionStepId)
		.where((expr) => flowExecutionStepReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readFlowExecutionStep = defineQuery(inputSchema, ({ ctx, args }) => {
	return readFlowExecutionStepQuery({ ctx, input: args });
});

export { readFlowExecutionStepZero as outputSchema } from '$lib/schema/flow/execution-step';
