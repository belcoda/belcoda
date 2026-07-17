import { getSignedPutUrl } from '$lib/server/utils/s3.js';
import { getOrganization } from '$lib/server/api/data/organization/index.js';
import {
	buildUploadKey,
	buildUserUploadKey,
	isExtensionAllowedForPurpose,
	isUploadPurpose,
	sanitizeExtension,
	UPLOAD_SIGNED_URL_EXPIRES_SECONDS,
	type UploadPurpose
} from '$lib/server/utils/upload-keys.js';
import { error, json } from '@sveltejs/kit';

import { env as publicEnv } from '$env/dynamic/public';
const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = publicEnv;

type UploadRequestParams = {
	organizationId: string | null;
	purpose: UploadPurpose;
	safeExtension: string;
};

function parseUploadParams(url: URL): UploadRequestParams {
	if (url.searchParams.has('key')) {
		error(400, 'Client-supplied upload keys are not allowed');
	}

	const organizationId = url.searchParams.get('organizationId');
	const purpose = url.searchParams.get('purpose');
	const extension = url.searchParams.get('extension');

	if (!purpose || !isUploadPurpose(purpose)) error(400, 'Missing or invalid purpose');
	if (!extension) error(400, 'Missing extension');

	let safeExtension: string;
	try {
		safeExtension = sanitizeExtension(extension);
	} catch {
		error(400, 'Invalid extension');
	}

	if (!isExtensionAllowedForPurpose(purpose, safeExtension)) {
		error(400, 'Extension is not allowed for this upload purpose');
	}

	return { organizationId, purpose, safeExtension };
}

async function authorizeOrganizationUpload(userId: string, organizationId: string) {
	try {
		await getOrganization({ userId, organizationId });
	} catch (e) {
		if (e instanceof Error && e.message === 'Organization not found') {
			error(404, 'Organization not found');
		}
		if (e instanceof Error && e.message === 'You are not a member of this organization') {
			error(403, 'You are not authorized to upload to this organization');
		}
		throw e;
	}
}

async function resolveUploadKey(
	userId: string,
	{ organizationId, purpose, safeExtension }: UploadRequestParams
): Promise<string> {
	if (organizationId) {
		await authorizeOrganizationUpload(userId, organizationId);
		return buildUploadKey({ organizationId, purpose, extension: safeExtension });
	}

	if (purpose === 'imageupload') {
		return buildUserUploadKey({ userId, purpose, extension: safeExtension });
	}

	error(400, 'Missing organizationId');
}

export async function GET(event) {
	const { url, locals } = event;

	if (!locals.session?.user?.id) {
		error(401, 'Unauthorized');
	}

	const params = parseUploadParams(url);
	const key = await resolveUploadKey(locals.session.user.id, params);
	const signedUrl = await getSignedPutUrl(
		PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME,
		key,
		UPLOAD_SIGNED_URL_EXPIRES_SECONDS
	);
	return json({ key, signedUrl });
}
