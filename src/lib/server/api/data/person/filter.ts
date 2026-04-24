import { type FilterGroupType } from '$lib/schema/person/filter';
import { type ServerTransaction } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import { whereClause } from '$lib/zero/query/person/filter';
import { getQueryContext, getApiQueryContext } from '$lib/server/api/utils/auth/permissions.js';

export async function getPersonRecordsFromFilter({
	filter,
	tx,
	organizationId,
	userId
}: {
	filter: FilterGroupType;
	tx: ServerTransaction;
	organizationId: string;
	userId?: string | null;
}) {
	const filterInput = {
		filter: filter,
		organizationId: organizationId
	};

	const ctx = userId ? await getQueryContext(userId) : await getApiQueryContext(organizationId);

	const result = await tx.run(
		builder.person.where((expr) => whereClause(expr, { filter: filterInput, ctx }))
	);
	return result;
}
