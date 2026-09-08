import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { flowExecutionStatus } from '$lib/schema/flow';
import { flowExecutionReadPermissions } from '$lib/zero/query/flow_execution/permissions';
import { readFlowExecutionZero } from '$lib/schema/flow/execution';
import { decodeFlowListCursor } from '$lib/utils/flow/cursor';

export const inputSchema = object({
	...listFilter.entries,
	flowDocumentId: optional(uuid),
	personId: optional(uuid),
	status: optional(nullable(flowExecutionStatus))
});
export type FlowExecutionListFilter = InferOutput<typeof inputSchema>;

function listFlowExecutionsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.flowExecution
		.where((expr) => flowExecutionReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	// flowExecution has no always-present column (e.g. deletedAt) to seed filterArr with, so — unlike
	// sibling list queries — only apply the optional filters when at least one was actually supplied,
	// rather than calling and() with zero conditions.
	if (input.flowDocumentId || input.personId || input.status) {
		q = q.where((expr) => whereClause(expr, { filter: input }));
	}
	if (input.cursor) {
		const cursor = decodeFlowListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listFlowExecutionsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listFlowExecutionsQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listFlowExecutionsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listFlowExecutionsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listFlowExecutions = defineQuery(inputSchema, ({ ctx, args }) => {
	return listFlowExecutionsPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'flowExecution', Schema>,
	{ filter }: { filter: InferOutput<typeof inputSchema> }
) {
	const { and, cmp } = builder;
	const filterArr: ReturnType<typeof cmp>[] = [];

	if (filter.flowDocumentId) {
		filterArr.push(cmp('flowDocumentId', '=', filter.flowDocumentId!));
	}
	if (filter.personId) {
		filterArr.push(cmp('personId', '=', filter.personId!));
	}
	if (filter.status) {
		filterArr.push(cmp('status', '=', filter.status));
	}

	return and(...filterArr);
}

export const outputSchema = array(readFlowExecutionZero);
