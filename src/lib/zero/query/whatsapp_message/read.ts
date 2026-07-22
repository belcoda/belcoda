import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { whatsappMessageReadPermissions } from '$lib/zero/query/whatsapp_message/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';

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
		.related('whatsappAccount')
		// whatsappMessageReadPermissions admits any org member, which is broader than
		// personReadPermissions. Apply the person predicate to the relation so a member
		// without team/admin access to this person cannot read the full person row here.
		.related('person', (person) => person.where((expr) => personReadPermissions(expr, ctx)).one())
		.where((expr) => whatsappMessageReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readWhatsappMessage = defineQuery(inputSchema, ({ ctx, args }) => {
	return readWhatsappMessageQuery({ ctx, input: args });
});

export { readWhatsappMessageZero as outputSchema } from '$lib/schema/whatsapp-message';
