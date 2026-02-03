import { listPersonsQuery, inputSchema, outputSchema } from '$lib/zero/query/person/list';
import { readPersonRest, readPersonZero } from '$lib/schema/person';
import { json } from '@sveltejs/kit';
import { runQuery } from '$lib/server/db/query';
import { array } from 'valibot';
export const GET = async (event) => {
	try {
		const { data, status } = await runQuery({
			query: listPersonsQuery,
			input: {
				organizationId: '6fa796c2-1c27-40d5-9d50-119b90ce409f',
				searchString: null,
				teamId: null,
				isDeleted: null,
				startAfter: null,
				excludedIds: [],
				pageSize: 3
			},
			userId: event.locals.authorizedApiUser!,
			inputSchema,
			outputSchema: array(readPersonRest),
			fallback: 'emptyArray'
		});
		return json(data, { status });
	} catch (error) {
		console.error(error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
