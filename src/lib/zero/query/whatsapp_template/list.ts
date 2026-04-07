import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable } from 'valibot';
import { listFilter, parseSchema, type ListFilter, uuid } from '$lib/schema/helpers';
import { whatsappTemplateReadPermissions } from '$lib/zero/query/whatsapp_template/permissions';
import { readWhatsappTemplateZero } from '$lib/schema/whatsapp-template';

export const inputSchema = object({
	...listFilter.entries
});
export type ListWhatsappTemplatesInput = InferOutput<typeof inputSchema>;

export function listWhatsappTemplatesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.whatsappTemplate
		.where((expr) => whatsappTemplateReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}

	return q;
}

export const listWhatsappTemplates = defineQuery(inputSchema, ({ ctx, args }) => {
	return listWhatsappTemplatesQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'whatsappTemplate', Schema>,
	{ filter }: { filter: ListWhatsappTemplatesInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp, exists } = builder;
	const filterArr = [
		cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null),
		cmp('id', 'NOT IN', filter.excludedIds)
	];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('name', 'ILIKE', `%${filter.searchString}%`));
	}
	return and(...filterArr);
}

export const outputSchema = array(readWhatsappTemplateZero);
