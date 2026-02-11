import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, nullable, optional } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { readActionCodeZero, actionCodeType } from '$lib/schema/action-code';

export const inputSchema = object({
	organizationId: listFilter.entries.organizationId,
	referenceId: optional(nullable(uuid))
});
export type EventListFilter = InferOutput<typeof inputSchema>;

export function listActionCodesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.actionCode
		.where('organizationId', '=', input.organizationId)
		.where('referenceId', '=', input.referenceId!)
		.where('deletedAt', 'IS', null)
		.orderBy('createdAt', 'desc');
	return q;
}

export const listActionCodes = defineQuery(inputSchema, ({ args, ctx }) => {
	return listActionCodesQuery({ ctx, input: args });
});

export const outputSchema = array(readActionCodeZero);
