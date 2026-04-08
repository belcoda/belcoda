import { parse } from 'valibot';
import { Z } from 'zero-svelte';

import { queryContextSchema, schema, type Schema, type QueryContext } from '$lib/zero/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { mutators } from '$lib/zero/mutate/client_mutators';

class ZeroInstance {
	#z = $state<Z | null>(null);

	/** True once {@link #init} has created the client; safe for layout gating (unlike {@link instance}). */
	get hasInstance(): boolean {
		return this.#z !== null;
	}

	get instance(): Z {
		if (!this.#z) {
			throw new Error('Zero instance accessed before initialization!');
		}
		return this.#z;
	}

	init(userId: string | undefined, queryContext: QueryContext | undefined) {
		if (userId === undefined || userId === null || String(userId).trim() === '') {
			throw new Error('zero.init: userId is required and must be non-empty');
		}
		if (queryContext === undefined || queryContext === null) {
			throw new Error('zero.init: queryContext is required');
		}

		let parsedContext: QueryContext;
		try {
			parsedContext = parse(queryContextSchema, queryContext);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			throw new Error(`zero.init: invalid queryContext (${msg})`);
		}

		if (parsedContext.userId !== userId) {
			throw new Error('zero.init: queryContext.userId must match userId');
		}

		const cacheURL = publicEnv.PUBLIC_ZERO_SERVER;
		if (!cacheURL) {
			throw new Error('zero.init: PUBLIC_ZERO_SERVER is not configured');
		}

		const appOrigin = publicEnv.PUBLIC_HOST?.replace(/\/$/, '');
		if (!appOrigin) {
			throw new Error('zero.init: PUBLIC_HOST is not configured');
		}

		this.#z = new Z({
			cacheURL,
			schema,
			mutators,
			kvStore: 'idb',
			context: parsedContext,
			userID: userId,
			// Must match ZERO_QUERY_URL / ZERO_MUTATE_URL on the sync server (full URL, not a path).
			queryURL: `${appOrigin}/api/utils/zero/query`,
			mutateURL: `${appOrigin}/api/utils/zero/push`
		});
	}
}

export const zero = new ZeroInstance();
/**
 * The 'z' export is a "Transparent Proxy".
 * * PROBLEM:
 * We need 'z' to be available for import everywhere (even in .ts files), but it
 * can't be initialized until the root layout runs (because it needs Auth/User IDs).
 * * SOLUTION:
 * We export this Proxy. It acts as a redirector to the internal #instance.
 * * WHY THE .bind()?
 * Zero uses private class members (e.g., #zero). In JS, if you call a method
 * via a Proxy, 'this' becomes the Proxy, not the original object. Private
 * members throw a TypeError if 'this' isn't the original instance.
 * We intercept function calls and manually bind 'this' back to the real instance.
 */
export const z = new Proxy({} as Z, {
	get(_, prop) {
		if (!zero.hasInstance) {
			throw new Error('z proxy used before zero.init()');
		}
		const instance = zero.instance;
		const value = Reflect.get(instance, prop);

		// If the property is a function, we MUST bind it to the instance
		// otherwise 'this' will be the Proxy, and private # fields will explode.
		if (typeof value === 'function') {
			return value.bind(instance);
		}

		return value;
	}
});

declare module '@rocicorp/zero' {
	interface DefaultTypes {
		context: QueryContext;
		schema: Schema;
	}
}
