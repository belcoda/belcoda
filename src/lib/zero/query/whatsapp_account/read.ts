import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { type InferOutput, object } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { whatsappAccountReadPermissions } from '$lib/zero/query/whatsapp_account/permissions';
import { readWhatsappAccountZero } from '$lib/schema/whatsapp-account';

export const inputSchema = object({
	whatsappAccountId: uuid
});

export function readWhatsappAccountQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	return builder.whatsappAccount
		.where('id', '=', input.whatsappAccountId)
		.where((expr) => whatsappAccountReadPermissions(expr, ctx))
		.one();
}

export const readWhatsappAccount = defineQuery(inputSchema, ({ ctx, args }) => {
	return readWhatsappAccountQuery({ ctx, input: args });
});

export const outputSchema = readWhatsappAccountZero;
export type ReadWhatsappAccountOutput = InferOutput<typeof outputSchema>;
