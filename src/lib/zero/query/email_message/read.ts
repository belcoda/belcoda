import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { emailMessageReadPermissions } from '$lib/zero/query/email_message/permissions';
import { readEmailMessageZero } from '$lib/schema/email-message';

export const inputSchema = object({
	emailMessageId: uuid
});

export function readEmailMessageQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.emailMessage
		.where('id', '=', input.emailMessageId)
		.where((expr) => emailMessageReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEmailMessage = defineQuery(inputSchema, ({ ctx, args }) => {
	return readEmailMessageQuery({ ctx, input: { emailMessageId: args.emailMessageId } });
});

export const outputSchema = readEmailMessageZero;
