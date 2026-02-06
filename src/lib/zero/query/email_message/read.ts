import { syncedQueryWithContext } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { emailMessageReadPermissions } from '$lib/zero/query/email_message/permissions';
import { readEmailMessageZero } from '$lib/schema/email-message';

export const inputSchema = object({
	emailMessageId: uuid
});

export function readEmailMessageQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.emailMessage
		.where('id', '=', input.emailMessageId)
		.where((expr) => emailMessageReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEmailMessage = syncedQueryWithContext(
	'readEmailMessage',
	parseSchema(inputSchema),
	(ctx: QueryContext, { emailMessageId }) => {
		return readEmailMessageQuery({ ctx, input: { emailMessageId } });
	}
);

export const outputSchema = readEmailMessageZero;
