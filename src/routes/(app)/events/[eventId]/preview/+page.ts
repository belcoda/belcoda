import { authClient } from '$lib/auth-client';
import { redirect, error } from '@sveltejs/kit';
export async function load({ params, url, data: serverData }) {
	const { data, error: generateError } = await authClient.oneTimeToken.generate();
	if (generateError) {
		console.error(generateError, 'Error generating one time token');
		return error(500, 'Error generating one time token');
	}
	if (!data) {
		console.error(data, 'Error generating one time token');
		return error(500, 'Error generating one time token');
	}
	const redirectUrl = new URL(serverData.url);
	redirectUrl.searchParams.set('authToken', data.token);
	console.log({ url: redirectUrl.toString(), token: data.token });
	return redirect(302, redirectUrl.toString());
}
