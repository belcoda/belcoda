import { getSignedUploadUrl } from '@tigrisdata/storage';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import pino from '$lib/pino';
import { _listOrganizationMembershipsByUserIdUnsafe } from '$lib/server/api/data/organization';
import { getOrgIdFromPath, MAX_IMAGE_UPLOAD_BYTES } from '$lib/components/ui/file-upload/helpers';
const log = pino(import.meta.url);

// Signed upload URLs are short-lived: the client requests one and uploads
// immediately after, so a 5-minute window is ample.
const SIGNED_UPLOAD_EXPIRY_SECONDS = 300;

// pino has no error serializer configured, so pull the useful fields off the
// error ourselves rather than logging an opaque `{}`.
function errorDetail(error: unknown) {
	if (error instanceof Error) {
		return { message: error.message, name: error.name, stack: error.stack };
	}
	return { message: String(error) };
}

export async function POST(event) {
	if (!event.locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const organizationId = event.params.organizationId;
	if (!organizationId) {
		return json({ error: 'Organization ID is required' }, { status: 400 });
	}

	const memberships = await _listOrganizationMembershipsByUserIdUnsafe({
		userId: event.locals.session.user.id
	});
	if (!memberships.some((m) => m.organizationId === organizationId)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let key: string;
	let contentType: string | undefined;
	try {
		const body = await event.request.json();
		key = body.name;
		contentType = typeof body.contentType === 'string' ? body.contentType : undefined;
		// The client generates the object key, but the org segment in it must match
		// the authorized organization so a member can't write into another org's space.
		if (typeof key !== 'string' || getOrgIdFromPath(key) !== organizationId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
	} catch (error) {
		log.error({ error }, 'Failed to parse upload request body');
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	// Surface config problems early with a clear signal (never log the secrets
	// themselves — only whether each is present).
	const config = {
		bucket: env.TIGRIS_STORAGE_PUBLIC_BUCKET_NAME,
		accessKeyId: env.TIGRIS_STORAGE_ACCESS_KEY_ID,
		secretAccessKey: env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
		endpoint: env.TIGRIS_STORAGE_ENDPOINT
	};
	log.info(
		{
			key,
			contentType,
			maxSize: MAX_IMAGE_UPLOAD_BYTES,
			endpoint: config.endpoint,
			hasBucket: Boolean(config.bucket),
			hasAccessKeyId: Boolean(config.accessKeyId),
			hasSecretAccessKey: Boolean(config.secretAccessKey)
		},
		'Requesting Tigris signed upload URL'
	);

	try {
		const { data, error } = await getSignedUploadUrl(key, {
			// Size cap is a server-side policy baked into the signature; `maxSize`
			// makes this a POST policy with a content-length-range condition that
			// Tigris enforces on upload. Never trust a client-supplied limit.
			maxSize: MAX_IMAGE_UPLOAD_BYTES,
			contentType,
			expiresIn: SIGNED_UPLOAD_EXPIRY_SECONDS,
			access: 'public',
			config
		});

		if (error) {
			log.error({ detail: errorDetail(error), key }, 'Failed to create signed upload URL');
			return json(
				{ error: 'Failed to process upload request', detail: dev ? errorDetail(error) : undefined },
				{ status: 500 }
			);
		}

		log.info({ key, method: data.method }, 'Created Tigris signed upload URL');
		// Return only the signed-upload contract the client needs for
		// `uploadToSignedUrl`; never expose the Tigris credentials.
		return json({ data });
	} catch (error) {
		log.error({ detail: errorDetail(error), key }, 'Failed to process upload request');
		return json(
			{ error: 'Failed to process upload request', detail: dev ? errorDetail(error) : undefined },
			{ status: 500 }
		);
	}
}
