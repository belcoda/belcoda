import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { type InferOutput, object } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { webhookReadPermissions } from '$lib/zero/query/webhook/permissions';
import { readWebhookZero } from '$lib/schema/webhook';

export const inputSchema = object({
	webhookId: uuid
});

export function readWebhookQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	return builder.webhook
		.where('id', '=', input.webhookId)
		.where((expr) => webhookReadPermissions(expr, ctx))
		.one();
}

export const readWebhook = defineQuery(inputSchema, ({ ctx, args }) => {
	return readWebhookQuery({ ctx, input: args });
});

export const outputSchema = readWebhookZero;
export type ReadWebhookOutput = InferOutput<typeof outputSchema>;
