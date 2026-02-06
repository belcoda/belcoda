import { syncedQueryWithContext } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { type InferOutput, object } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { emailFromSignatureReadPermissions } from '$lib/zero/query/email_from_signature/permissions';
import { readEmailFromSignatureZero } from '$lib/schema/email-from-signature';

export const inputSchema = object({
	emailFromSignatureId: uuid
});

export function readEmailFromSignatureQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.emailFromSignature
		.where('id', '=', input.emailFromSignatureId)
		.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEmailFromSignature = syncedQueryWithContext(
	'readEmailFromSignature',
	parseSchema(inputSchema),
	(ctx: QueryContext, { emailFromSignatureId }) => {
		return readEmailFromSignatureQuery({ ctx, input: { emailFromSignatureId } });
	}
);

export const outputSchema = readEmailFromSignatureZero;
export type ReadEmailFromSignatureOutput = InferOutput<typeof outputSchema>;
