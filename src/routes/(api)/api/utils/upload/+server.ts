import { getSignedPutUrl } from '$lib/server/utils/s3.js';
import {
	buildUploadKey,
	isUploadPurpose,
	sanitizeExtension
} from '$lib/server/utils/upload-keys.js';
import { error, json } from '@sveltejs/kit';

import { env as publicEnv } from '$env/dynamic/public';
const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = publicEnv;

export async function GET({ url }) {
	if (url.searchParams.has('key')) {
		return error(400, 'Client-supplied upload keys are not allowed');
	}

	const organizationId = url.searchParams.get('organizationId');
	const purpose = url.searchParams.get('purpose');
	const extension = url.searchParams.get('extension');

	if (!organizationId) return error(400, 'Missing organizationId');
	if (!purpose || !isUploadPurpose(purpose)) return error(400, 'Missing or invalid purpose');
	if (!extension) return error(400, 'Missing extension');

	let safeExtension: string;
	try {
		safeExtension = sanitizeExtension(extension);
	} catch {
		return error(400, 'Invalid extension');
	}

	const key = buildUploadKey({ organizationId, purpose, extension: safeExtension });
	const signedUrl = await getSignedPutUrl(PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME, key, 3600);
	return json({ key, signedUrl });
}
