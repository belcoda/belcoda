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
	const userID = event.locals.session.user.id;
	const ctx = await getQueryContext(userID);

	const result = await handleQueryRequest({
		handler: (name, args) => {
			const query = mustGetQuery(queries, name);
			return query.fn({ args, ctx });
		},
		schema,
		request: event.request,
		userID
	});
	return json(result);
}
