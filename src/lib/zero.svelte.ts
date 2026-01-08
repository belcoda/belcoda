import { Z } from 'zero-svelte';

import { schema, type Schema } from '$lib/zero/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { jwtDecode } from 'jwt-decode';
import createMutators from '$lib/zero/mutate/client_mutators';

export const z = new Z<Schema, ReturnType<typeof createMutators>>(get_z_options());

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

function getCookie(name: string): string | null {
	const cookies = document.cookie.split('; ');
	for (const cookie of cookies) {
		const [key, value] = cookie.split('=');
		if (key === name) return decodeURIComponent(value);
	}
	return null;
}

async function getToken() {
	const jwt = getCookie(publicEnv.PUBLIC_ZERO_AUTH_COOKIE_NAME);
	if (!jwt) {
		//todo: refresh
		throw new Error('No JWT found');
	}
	return jwt;
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
