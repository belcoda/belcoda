import { defineQuery } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { type InferOutput, object, array } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { readPersonZero } from '$lib/schema/person';
import { readTagZero } from '$lib/schema/tag';
import { readTeamZero } from '$lib/schema/team';
import { readPersonNoteZero } from '$lib/schema/person-note';

export const inputSchema = object({
	personId: uuid
});

export function readPersonQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.person
		.where('id', '=', input.personId)
		.related('tags')
		.limit(100)
		.orderBy('createdAt', 'desc')
		.related('teams')
		.limit(100)
		.orderBy('createdAt', 'desc')
		.related('notes')
		.limit(100)
		.orderBy('createdAt', 'desc')
		.where((expr) => personReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readPerson = defineQuery(inputSchema, ({ ctx, args }) => {
	return readPersonQuery({ ctx, input: args });
});

export const outputSchema = object({
	...readPersonZero.entries,
	tags: array(readTagZero),
	teams: array(readTeamZero),
	notes: array(readPersonNoteZero)
});
export type ReadPersonOutput = InferOutput<typeof outputSchema>;

export type ReadPersonOutputWithReadonlyArrays = Omit<
	ReadPersonOutput,
	'tags' | 'teams' | 'notes'
> & {
	readonly tags: readonly ReadPersonOutput['tags'][number][];
	readonly teams: readonly ReadPersonOutput['teams'][number][];
	readonly notes: readonly ReadPersonOutput['notes'][number][];
};
