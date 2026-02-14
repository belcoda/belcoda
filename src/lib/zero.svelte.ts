import { Z } from 'zero-svelte';

import { schema, type Schema, type QueryContext } from '$lib/zero/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { mutators } from '$lib/zero/mutate/client_mutators';

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
			mutators,
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

declare module '@rocicorp/zero' {
	interface DefaultTypes {
		context: QueryContext;
		schema: Schema;
	}
}
