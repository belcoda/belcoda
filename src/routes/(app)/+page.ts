import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
	const queryString = url.search ? url.search : '';
	return redirect(302, `/community${queryString}`);
}
