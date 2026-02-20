import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { getPetitionLink } from '$lib/utils/petitions/link';
import { getPetitionById } from '$lib/server/api/data/petition/petition.js';
import { getOrganization } from '$lib/server/api/data/organization';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions.js';
export async function load({ params, locals }) {
	if (!locals.session) {
		return error(401, 'Unauthorized');
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

	const url = getPetitionLink({
		petitionSlug: petition.slug,
		organizationSlug: organization.slug
	});

	return { url };
}
