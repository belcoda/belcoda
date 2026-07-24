import { json, error } from '@sveltejs/kit';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { mustGetMutator } from '@rocicorp/zero';
import { db as dbProvider } from '$lib/server/db/index';

import { mutators } from '$lib/server/api/mutate/server_mutators';
import pino from '$lib/pino';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions.js';
const log = pino(import.meta.url);

export async function POST(event) {
	if (!event.locals.session) {
		return json(
			{ error: 'Unable to load Zero instance on the server because no session is present' },
			{ status: 401 }
		);
	}
	try {
		const userID = event.locals.session.user.id;
		const queryContext = await getQueryContext(userID);
		const result = await handleMutateRequest({
			dbProvider,
			handler: (transact) =>
				transact((tx, name, args) => {
					const mutator = mustGetMutator(mutators, name);
					return mutator.fn({
						args,
						tx,
						ctx: queryContext
					});
				}),
			request: event.request,
			userID
		});

		return json(result);
	} catch (err) {
		log.fatal(err, 'Error processing push protocol in push request');
		return error(500, 'Internal server error');
	}
}
