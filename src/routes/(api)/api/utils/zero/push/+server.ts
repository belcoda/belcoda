import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { processor } from '$lib/server/db/zeroPushProcessor';
import { createMutators } from '$lib/server/api/mutate/server_mutators';

import { type MutatorAsyncTasks, type MutatorResult } from '$lib/zero/schema';
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
	const queryContext = await getQueryContext(event.locals.session.user.id);

	try {
		const asyncTasks: MutatorAsyncTasks = [];
		const result: MutatorResult = []; // in the push processor, we ignore the outcome because we won't be returning data to the client
		const processorOutput = await processor.process(
			createMutators({ queryContext, asyncTasks, result }),
			event.request
		);

		const promiseResults = await Promise.allSettled(asyncTasks.map((task) => task()));
		if (promiseResults.some((result) => result.status === 'rejected')) {
			log.error(
				promiseResults.find((result) => result.status === 'rejected')?.reason,
				'Error executing async tasks in push request'
			);
			return error(500, 'Internal server error');
		}
		return json(processorOutput);
	} catch (err) {
		log.fatal(err, 'Error processing push protocol in push request');
		return error(500, 'Internal server error');
	}
}
