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
	ctx
}: {
	filter: FilterGroupType;
	organizationId: string;
	ctx: QueryContext;
}): Promise<string[]> {
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

	return result.map((p) => p.id);
}
