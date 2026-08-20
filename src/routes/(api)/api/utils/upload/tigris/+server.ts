import { handleClientUpload } from '@tigrisdata/storage';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const { data, error } = await handleClientUpload(body, {
			bucket: env.TIGRIS_STORAGE_PUBLIC_BUCKET_NAME,
			accessKeyId: env.TIGRIS_STORAGE_ACCESS_KEY_ID,
			secretAccessKey: env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
			endpoint: env.TIGRIS_STORAGE_ENDPOINT
		});

		if (error) {
			return json({ error: error.message }, { status: 500 });
		}

		return json({ data });
	} catch (error) {
		return json({ error: 'Failed to process upload request' }, { status: 500 });
	}
}
