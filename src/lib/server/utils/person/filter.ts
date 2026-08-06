import { type FilterGroupType } from '$lib/schema/person/filter';
import { db } from '$lib/server/db';
import { whereClause } from '$lib/zero/query/person/filter';
import { builder, type QueryContext } from '$lib/zero/schema';

/**
 * Count persons matching the filter criteria
 */
export async function countPersonsFromFilter({
	filter,
	organizationId,
	ctx
}: {
	filter: FilterGroupType;
	organizationId: string;
	ctx: QueryContext;
}): Promise<number> {
	const result = await db.run(
		builder.person
			.where((expr) =>
				whereClause(expr, {
					filter: { filter, organizationId },
					ctx
				})
			)
			.where('emailAddress', 'IS NOT', null)
	);

	return result.length;
}

export async function getPersonIdsFromFilter({
	filter,
	organizationId,
	ctx,
	requireEmailAddress = true
}: {
	filter: FilterGroupType;
	organizationId: string;
	ctx: QueryContext;
	// Defaults to true to preserve behaviour for email-recipient callers. Flow triggers
	// (event signup, WhatsApp, etc.) don't require an email address, so they pass false.
	requireEmailAddress?: boolean;
}): Promise<string[]> {
	const baseQuery = builder.person.where((expr) =>
		whereClause(expr, {
			filter: { filter, organizationId },
			ctx
		})
	);
	const query = requireEmailAddress ? baseQuery.where('emailAddress', 'IS NOT', null) : baseQuery;
	const result = await db.run(query);

	return result.map((p) => p.id);
}
