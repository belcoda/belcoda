import { getSignedPutUrl } from '$lib/server/utils/s3.js';
import { error, json } from '@sveltejs/kit';

import { env as publicEnv } from '$env/dynamic/public';
const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = publicEnv;

export async function GET({ url }) {
	const key = url.searchParams.get('key');
	if (!key) return error(400, 'Missing key');
	const signedUrl = await getSignedPutUrl(PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME, key, 3600);
	return json({ signedUrl }); // just return the signed URL
}
