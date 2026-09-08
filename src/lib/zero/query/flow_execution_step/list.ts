import { defineQuery } from '@rocicorp/zero';
import { builder, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { flowExecutionStepReadPermissions } from '$lib/zero/query/flow_execution_step/permissions';
import { readFlowExecutionStepZero } from '$lib/schema/flow/execution-step';

export const inputSchema = object({
	flowExecutionId: uuid
});
export type FlowExecutionStepListFilter = InferOutput<typeof inputSchema>;

// Steps for one execution, in timeline order. Bounded per execution, so no cursor pagination.
export function listFlowExecutionStepsByExecutionQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	return builder.flowExecutionStep
		.where('flowExecutionId', '=', input.flowExecutionId)
		.where((expr) => flowExecutionStepReadPermissions(expr, ctx))
		.orderBy('createdAt', 'asc')
		.orderBy('id', 'asc');
}

export const listFlowExecutionSteps = defineQuery(inputSchema, ({ ctx, args }) => {
	return listFlowExecutionStepsByExecutionQuery({ ctx, input: args });
});

export const outputSchema = array(readFlowExecutionStepZero);
