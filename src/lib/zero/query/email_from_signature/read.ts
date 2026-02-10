import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { type InferOutput, object } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { emailFromSignatureReadPermissions } from '$lib/zero/query/email_from_signature/permissions';
import { readEmailFromSignatureZero } from '$lib/schema/email-from-signature';

export const inputSchema = object({
	emailFromSignatureId: uuid
});

export function readEmailFromSignatureQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.emailFromSignature
		.where('id', '=', input.emailFromSignatureId)
		.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEmailFromSignature = defineQuery(inputSchema, ({ ctx, args }) => {
	return readEmailFromSignatureQuery({
		ctx,
		input: { emailFromSignatureId: args.emailFromSignatureId }
	});
});

export const outputSchema = readEmailFromSignatureZero;
export type ReadEmailFromSignatureOutput = InferOutput<typeof outputSchema>;
