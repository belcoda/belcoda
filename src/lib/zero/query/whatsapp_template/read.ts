import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { whatsappTemplateReadPermissions } from '$lib/zero/query/whatsapp_template/permissions';
import { readWhatsappTemplateZero } from '$lib/schema/whatsapp-template';

export const inputSchema = object({
	templateId: uuid
});

export function readWhatsappTemplateQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.whatsappTemplate
		.where('id', '=', input.templateId)
		.where((expr) => whatsappTemplateReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readWhatsappTemplate = defineQuery(inputSchema, ({ ctx, args }) => {
	return readWhatsappTemplateQuery({ ctx, input: args });
});

export const outputSchema = readWhatsappTemplateZero;
