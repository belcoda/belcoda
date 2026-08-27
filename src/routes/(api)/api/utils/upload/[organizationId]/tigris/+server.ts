import { handleClientUpload } from '@tigrisdata/storage';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import pino from '$lib/pino';
import { _listOrganizationMembershipsByUserIdUnsafe } from '$lib/server/api/data/organization';
import { getOrgIdFromPath } from '$lib/components/ui/file-upload/helpers';
const log = pino(import.meta.url);

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

	let body;
	try {
		body = await event.request.json();
		const path = body.name;
		log.debug({ path }, 'Path');
		const orgId = getOrgIdFromPath(path);
		log.debug({ orgId }, 'Org ID');
		if (orgId !== organizationId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
	} catch (error) {
		log.error({ error }, 'Failed to parse upload request body');
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	try {
		const { data, error } = await handleClientUpload(body, {
			bucket: env.TIGRIS_STORAGE_PUBLIC_BUCKET_NAME,
			accessKeyId: env.TIGRIS_STORAGE_ACCESS_KEY_ID,
			secretAccessKey: env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
			endpoint: env.TIGRIS_STORAGE_ENDPOINT
		});

		if (error) {
			log.error({ error }, 'Failed to handle client upload');
			return json({ error: 'Failed to process upload request' }, { status: 500 });
		}

		return json({ data });
	} catch (error) {
		log.error({ error }, 'Failed to process upload request');
		return json({ error: 'Failed to process upload request' }, { status: 500 });
	}
}
