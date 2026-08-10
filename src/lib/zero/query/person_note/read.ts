import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { type InferOutput, object } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { personNoteReadPermissions } from '$lib/zero/query/person_note/permissions';
import { readPersonNoteWithUserZero } from '$lib/schema/person-note';

export const inputSchema = object({
	personNoteId: uuid
});

export function readPersonNoteQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.personNote
		.where('id', '=', input.personNoteId)
		.related('user', (expr) => expr.one())
		.where((expr) => personNoteReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readPersonNote = defineQuery(inputSchema, ({ ctx, args }) => {
	return readPersonNoteQuery({ ctx, input: args });
});

export const outputSchema = readPersonNoteWithUserZero;
export type ReadPersonNoteOutput = InferOutput<typeof outputSchema>;
