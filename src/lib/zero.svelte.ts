import { Z } from 'zero-svelte';

import { schema, type Schema, type QueryContext } from '$lib/zero/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { jwtDecode } from 'jwt-decode';
import createMutators from '$lib/zero/mutate/client_mutators';
/* 
function get_z_options() {
	const userId = getAuthData();
	return {
		schema,
		server: publicEnv.PUBLIC_ZERO_SERVER,
		userID: userId,
		mutators: createMutators(),
		auth: async () => {
			const token = await getToken();
			return token;
		}
	} as const;
}
 */

class ZeroInstance {
	#z = $state<Z | null>(null);
	get instance(): Z {
		if (!this.#z) {
			throw new Error('Zero instance accessed before initialization!');
		}
		return this.#z;
	}
	init(userId: string, queryContext: QueryContext) {
		this.#z = new Z({
			cacheURL: publicEnv.PUBLIC_ZERO_SERVER,
			schema,
			mutators: createMutators(),
			kvStore: 'idb',
			context: queryContext,
			userID: userId
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

/* export const z = new Z({
	cacheURL: publicEnv.PUBLIC_ZERO_SERVER,
	schema,
	mutators: createMutators(),
	kvStore: 'idb',
	userID: 'anon'
}); */

declare module '@rocicorp/zero' {
	interface DefaultTypes {
		context: QueryContext;
		schema: Schema;
	}
}
/* 
function getCookie(name: string): string | null {
	if (typeof document === 'undefined') {
		return null;
	}
	const cookies = document.cookie.split('; ');
	for (const cookie of cookies) {
		const [key, value] = cookie.split('=');
		if (key === name) return decodeURIComponent(value);
	}
	return null;
}

async function getToken() {
	try {
		const jwt = getCookie(publicEnv.PUBLIC_ZERO_AUTH_COOKIE_NAME);
		if (!jwt) {
			//todo: refresh
			throw new Error('No JWT found');
		}
		return jwt;
	} catch (error) {
		return null;
	}
}

function getAuthData() {
	try {
		const jwt = getCookie(publicEnv.PUBLIC_ZERO_AUTH_COOKIE_NAME);
		if (!jwt) {
			throw new Error('No JWT found');
		}
		const decoded = jwtDecode(jwt);
		if (!decoded.sub) {
			throw new Error('No user ID found');
		}
		return decoded.sub;
	} catch (error) {
		return 'anonymous';
	}
}
 */
