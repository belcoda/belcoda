import { getSignedPutUrl } from '$lib/server/utils/s3.js';
import { getOrganization } from '$lib/server/api/data/organization/index.js';
import {
	buildUploadKey,
	buildUserUploadKey,
	isExtensionAllowedForPurpose,
	isUploadPurpose,
	sanitizeExtension,
	UPLOAD_SIGNED_URL_EXPIRES_SECONDS
} from '$lib/server/utils/upload-keys.js';
import { error, json } from '@sveltejs/kit';

import { env as publicEnv } from '$env/dynamic/public';
const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = publicEnv;

export async function GET(event) {
	const { url, locals } = event;

	if (!locals.session?.user?.id) {
		return error(401, 'Unauthorized');
	}
	const userId = locals.session.user.id;

	if (url.searchParams.has('key')) {
		return error(400, 'Client-supplied upload keys are not allowed');
	}

	const organizationId = url.searchParams.get('organizationId');
	const purpose = url.searchParams.get('purpose');
	const extension = url.searchParams.get('extension');

	if (!purpose || !isUploadPurpose(purpose)) return error(400, 'Missing or invalid purpose');
	if (!extension) return error(400, 'Missing extension');

	let safeExtension: string;
	try {
		safeExtension = sanitizeExtension(extension);
	} catch {
		return error(400, 'Invalid extension');
	}

	if (!isExtensionAllowedForPurpose(purpose, safeExtension)) {
		return error(400, 'Extension is not allowed for this upload purpose');
	}

	let key: string;
	if (organizationId) {
		try {
			await getOrganization({ userId, organizationId });
		} catch (e) {
			if (e instanceof Error && e.message === 'Organization not found') {
				return error(404, 'Organization not found');
			}
			if (e instanceof Error && e.message === 'You are not a member of this organization') {
				return error(403, 'You are not authorized to upload to this organization');
			}
			throw e;
		}

		key = buildUploadKey({ organizationId, purpose, extension: safeExtension });
	} else if (purpose === 'imageupload') {
		key = buildUserUploadKey({ userId, purpose, extension: safeExtension });
	} else {
		return error(400, 'Missing organizationId');
	}
	const signedUrl = await getSignedPutUrl(
		PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME,
		key,
		UPLOAD_SIGNED_URL_EXPIRES_SECONDS
	);
	return json({ key, signedUrl });
}
