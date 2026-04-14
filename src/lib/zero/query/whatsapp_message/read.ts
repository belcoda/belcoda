import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { whatsappMessageReadPermissions } from '$lib/zero/query/whatsapp_message/permissions';
import { readWhatsappMessageZero } from '$lib/schema/whatsapp-message';

export const inputSchema = object({
	whatsappMessageId: uuid
});

export function readWhatsappMessageQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.whatsappMessage
		.where('id', '=', input.whatsappMessageId)
		.where((expr) => whatsappMessageReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readWhatsappMessage = defineQuery(inputSchema, ({ ctx, args }) => {
	return readWhatsappMessageQuery({ ctx, input: args });
});

export const outputSchema = readWhatsappMessageZero;
