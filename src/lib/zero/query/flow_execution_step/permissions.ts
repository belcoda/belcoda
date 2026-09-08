import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { flowExecutionReadPermissions } from '$lib/zero/query/flow_execution/permissions';

// flow_execution_step has no organization/team columns of its own, so it is secured entirely by
// joining through its parent flow_execution and reusing that table's read permissions.
export function flowExecutionStepReadPermissions(
	builder: ExpressionBuilder<'flowExecutionStep', Schema>,
	ctx: QueryContext
) {
	const { exists } = builder;
	return exists('flowExecution', (e) => e.where((eb) => flowExecutionReadPermissions(eb, ctx)));
}
