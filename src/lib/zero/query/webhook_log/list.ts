import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { webhookLogReadPermissions } from '$lib/zero/query/webhook_log/permissions';
import { readWebhookLogZero } from '$lib/schema/webhook-log';

export const inputSchema = object({
	webhookId: uuid
});
export type ListWebhookLogsInput = InferOutput<typeof inputSchema>;

export function listWebhookLogsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: ListWebhookLogsInput;
}) {
	return builder.webhookLog
		.where((expr) => webhookLogReadPermissions(expr, ctx))
		.where('webhookId', '=', input.webhookId)
		.orderBy('createdAt', 'desc')
		.limit(50);
}

export const listWebhookLogs = defineQuery(inputSchema, ({ ctx, args }) => {
	return listWebhookLogsQuery({ ctx, input: args });
});

export const outputSchema = array(readWebhookLogZero);
