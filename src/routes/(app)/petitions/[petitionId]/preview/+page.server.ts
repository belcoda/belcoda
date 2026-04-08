import { redirect, error } from '@sveltejs/kit';

import { getPetitionById } from '$lib/server/api/data/petition/petition.js';
import { getOrganization } from '$lib/server/api/data/organization';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions.js';
import { generateOneTimeTokenFromRequest } from '$lib/server/api/utils/one_time_token_from_request';
import { db } from '$lib/server/db';
import { getPetitionLink } from '$lib/utils/petitions/link';

export async function load({ params, locals, request }) {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const { petitionId } = params;
	const ctx = await getQueryContext(locals.session.user.id);
	const petition = await db.transaction(async (tx) => {
		return await getPetitionById({
			petitionId,
			ctx,
			tx
		});
	});

	const organization = await getOrganization({
		userId: locals.session.user.id,
		organizationId: petition.organizationId
	});

	const publicUrl = getPetitionLink({
		petitionSlug: petition.slug,
		organizationSlug: organization.slug
	});

	const token = await generateOneTimeTokenFromRequest(request, locals.locale);
	const redirectUrl = new URL(publicUrl);
	redirectUrl.searchParams.set('authToken', token);

	throw redirect(302, redirectUrl.toString());
}
