import { handleQueryRequest } from '@rocicorp/zero/server';
import { mustGetQuery } from '@rocicorp/zero';
import { schema } from '$lib/zero/schema';
import queries from '$lib/zero/query';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { json } from '@sveltejs/kit';
export async function POST(event) {
	if (!event.locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const ctx = await getQueryContext(event.locals.session.user.id);

	const result = await handleQueryRequest(
		(name, args) => {
			const query = mustGetQuery(queries, name);
			return query.fn({ args, ctx });
		},
		schema,
		event.request
	);
	return json(result);
}
