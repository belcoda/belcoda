import { withValidation, type ReadonlyJSONValue } from '@rocicorp/zero';
import { handleGetQueriesRequest } from '@rocicorp/zero/server';
import { schema } from '$lib/zero/schema';

import { error, json } from '@sveltejs/kit';
import * as jose from 'jose';
import { env } from '$env/dynamic/private';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import * as allQueriesMap from '$lib/server/api/query/index';
const queryArr = Object.values(allQueriesMap);
import type { QueryContext } from '$lib/zero/schema';

import pino from '$lib/pino';
const log = pino(import.meta.url);

// Build a map of queries with validation by name.
const validated = Object.fromEntries(queryArr.map((q) => [q.queryName, withValidation(q)]));

export const POST = async (event) => {
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
