import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { whatsappThreadReadPermissions } from '$lib/zero/query/whatsapp_thread/permissions';
import { readWhatsappThreadZero } from '$lib/schema/whatsapp-thread';

export const inputSchema = object({
	threadId: uuid
});

export function readWhatsappThreadQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.whatsappThread
		.where('id', '=', input.threadId)
		.where((expr) => whatsappThreadReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readWhatsappThread = defineQuery(inputSchema, ({ ctx, args }) => {
	return readWhatsappThreadQuery({ ctx, input: args });
});

export const outputSchema = readWhatsappThreadZero;
