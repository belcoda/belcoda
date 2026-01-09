import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { petition, petitionSignature, organization } from '$lib/schema/drizzle';
import { eq, and, isNull, count } from 'drizzle-orm';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export async function load({ params, locals }) {
	const { organizationSlug, petitionSlug } = params;

	// Find organization by slug
	const [org] = await db
		.select()
		.from(organization)
		.where(eq(organization.slug, organizationSlug))
		.limit(1);

	if (!org) {
		throw error(404, 'Organization not found');
	}

	// Find petition by slug
	const [petitionData] = await db
		.select()
		.from(petition)
		.where(
			and(
				eq(petition.slug, petitionSlug),
				eq(petition.organizationId, org.id),
				isNull(petition.deletedAt)
			)
		)
		.limit(1);

	if (!petitionData) {
		throw error(404, 'Petition not found');
	}

	// Count signatures
	const [signatureCount] = await db
		.select({ count: count() })
		.from(petitionSignature)
		.where(eq(petitionSignature.petitionId, petitionData.id));

	const session = locals.session;

	// Check if user is admin/owner
	const isAdmin = session?.user?.id ? true : false; // TODO: Implement proper admin check

	// Serialize dates to avoid serialization issues
	const serializedPetition = {
		...petitionData,
		createdAt: petitionData.createdAt ? new Date(petitionData.createdAt).getTime() : null,
		updatedAt: petitionData.updatedAt ? new Date(petitionData.updatedAt).getTime() : null,
		deletedAt: petitionData.deletedAt ? new Date(petitionData.deletedAt).getTime() : null,
		archivedAt: petitionData.archivedAt ? new Date(petitionData.archivedAt).getTime() : null
	};

	return {
		petition: serializedPetition,
		organization: org,
		signatureCount: signatureCount?.count || 0,
		session,
		isAdmin
	};
}
