import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { processor } from '$lib/server/db/zeroPushProcessor';
import { createMutators } from '$lib/server/api/mutate/server_mutators';

import * as jose from 'jose';

import { env } from '$env/dynamic/private';
import { type MutatorAsyncTasks, type MutatorResult } from '$lib/zero/schema';
import pino from '$lib/pino';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions.js';
const log = pino(import.meta.url);

export async function POST(event) {
	const authHeader = event.request.headers.get('authorization');
	if (!authHeader) {
		return error(401, 'No authorization header found');
	}
	const [type, token] = authHeader.split(' ');
	if (type !== 'Bearer') {
		return error(401, 'Invalid authorization header');
	}
	const secret = new TextEncoder().encode(env.ZERO_AUTH_SECRET);

	const parsed = await jose
		.jwtVerify(token, secret, {
			issuer: env.AUTH_JWT_ISSUER,
			audience: env.AUTH_JWT_AUDIENCE
		})
		.catch((err) => {
			log.error(err, 'Error verifying JWT');
			return null;
		});

	if (!parsed) {
		return error(401, 'Unable to verify JWT');
	}

	const userId = parsed.payload.sub;
	if (!userId) {
		return error(401, 'User ID not found in JWT');
	}
	const queryContext = await getQueryContext(userId);

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
