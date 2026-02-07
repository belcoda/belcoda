import { withValidation, type ReadonlyJSONValue } from '@rocicorp/zero';
import { handleGetQueriesRequest } from '@rocicorp/zero/server';
import { schema } from '$lib/zero/schema';

import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import * as allQueriesMap from '$lib/server/api/query/index';
const queryArr = Object.values(allQueriesMap);
import type { QueryContext } from '$lib/zero/schema';

import pino from '$lib/pino';
const log = pino(import.meta.url);

// Build a map of queries with validation by name.
const validated = Object.fromEntries(queryArr.map((q) => [q.queryName, withValidation(q)]));

export const POST = async (event) => {
	if (!event.locals.session) {
		return json(
			{ error: 'Unable to load Zero instance on the server because no session is present' },
			{ status: 401 }
		);
	}
	const userId = event.locals.session.user.id;
	const { authTeams, adminOrgs, ownerOrgs } = await getQueryContext(userId);
	const ctx: QueryContext = { userId, authTeams, adminOrgs, ownerOrgs };
	const response = await handleGetQueriesRequest(
		(name, args) => {
			log.warn({ userId, name }, 'Running query on server');
			try {
				const q = getQuery(ctx, name, args);
				return q;
			} catch (error) {
				log.error({ error, ctx, queryName: name, args }, 'Error getting query');
				throw error;
			}
		},
		schema,
		event.request
	);
	return json(response);
};

function getQuery(ctx: QueryContext, name: string, args: readonly ReadonlyJSONValue[]) {
	const q = validated[name];
	if (!q) {
		throw new Error(`No such query: ${name}`);
	}
	log.debug({ ctx, name, args }, `Running query "${name}"`);
	return {
		// Pass authData to both auth'd and unauth'd queries
		query: q(ctx, ...args)
	};
}
