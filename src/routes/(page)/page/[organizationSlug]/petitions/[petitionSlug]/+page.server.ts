import { error, fail } from '@sveltejs/kit';
import { db, drizzle } from '$lib/server/db';
import { petition, petitionSignature, organization, person } from '$lib/schema/drizzle';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import pino from '$lib/pino';
import { signPetitionHelper } from '$lib/server/api/data/petition/signature';
import { parse } from 'valibot';
import { signPetitionFormSchema } from '$lib/schema/petition/petition-signature';
import { getAdminOwnerOrgs } from '$lib/server/api/utils/auth/permissions';

const log = pino(import.meta.url);

export async function load({ params, locals }) {
	const { organizationSlug, petitionSlug } = params;

	// Find organization by slug
	const [org] = await drizzle
		.select()
		.from(organization)
		.where(eq(organization.slug, organizationSlug))
		.limit(1);

	if (!org) {
		throw error(404, 'Organization not found');
	}

	// Find petition by slug
	const [petitionData] = await drizzle
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
	const [signatureCount] = await drizzle
		.select({ count: count() })
		.from(petitionSignature)
		.where(eq(petitionSignature.petitionId, petitionData.id));

	// Get recent signatures with person details
	const recentSignatures = await drizzle
		.select({
			id: petitionSignature.id,
			createdAt: petitionSignature.createdAt,
			givenName: person.givenName,
			familyName: person.familyName
		})
		.from(petitionSignature)
		.innerJoin(person, eq(petitionSignature.personId, person.id))
		.where(eq(petitionSignature.petitionId, petitionData.id))
		.orderBy(desc(petitionSignature.createdAt))
		.limit(10);

	const session = locals.session;
	const userId = session?.user?.id;
	let isAdmin = false;
	if (userId) {
		const { admin, owner } = await getAdminOwnerOrgs(userId);
		isAdmin = admin.includes(org.id) || owner.includes(org.id);
	}

	// Serialize dates to avoid serialization issues
	const serializedPetition = {
		...petitionData,
		createdAt: petitionData.createdAt ? new Date(petitionData.createdAt).getTime() : null,
		updatedAt: petitionData.updatedAt ? new Date(petitionData.updatedAt).getTime() : null,
		deletedAt: petitionData.deletedAt ? new Date(petitionData.deletedAt).getTime() : null,
		archivedAt: petitionData.archivedAt ? new Date(petitionData.archivedAt).getTime() : null
	};

	const serializedSignatures = recentSignatures.map((sig) => ({
		...sig,
		createdAt: sig.createdAt ? new Date(sig.createdAt).getTime() : null
	}));

	return {
		petition: serializedPetition,
		organization: org,
		signatureCount: signatureCount?.count || 0,
		recentSignatures: serializedSignatures,
		session,
		isAdmin
	};
}

export const actions = {
	sign: async ({ request, params, locals }) => {
		const { organizationSlug, petitionSlug } = params;

		//! NOTE: Using drizzle database operations for now because its a server page and we don't really
		//! need zero permission checks here. Will change if we need zero for consistency or any other
		//! reason.
		try {
			await db.transaction(async (tx) => {
				const [org] = await tx.dbTransaction.wrappedTransaction
					.select()
					.from(organization)
					.where(eq(organization.slug, organizationSlug))
					.limit(1);

				if (!org) {
					return fail(404, { error: 'Organization not found', success: false });
				}

				const petitionFilters = [
					eq(petition.slug, petitionSlug),
					eq(petition.organizationId, org.id),
					isNull(petition.deletedAt)
				];

				const [petitionData] = await tx.dbTransaction.wrappedTransaction
					.select()
					.from(petition)
					.where(and(...petitionFilters))
					.limit(1);

				if (!petitionData) {
					return fail(404, { error: 'Petition not found', success: false });
				}

				if (!petitionData.published) {
					return fail(400, { error: 'This petition is not published', success: false });
				}

				const formData = await request.formData();
				const phoneValue = formData.get('phoneNumber')?.toString().trim() || '';
				const data = {
					givenName: formData.get('givenName')?.toString() || '',
					familyName: formData.get('familyName')?.toString() || '',
					emailAddress: formData.get('emailAddress')?.toString() || '',
					phoneNumber: phoneValue.length ? phoneValue : undefined
				};
				const parsed = parse(signPetitionFormSchema, data);

				await signPetitionHelper({
					tx,
					petitionId: petitionData.id,
					organizationId: org.id,
					teamId: petitionData.teamId || undefined,
					personAction: {
						givenName: parsed.givenName || null,
						familyName: parsed.familyName || null,
						emailAddress: parsed.emailAddress || null,
						phoneNumber: parsed.phoneNumber || null,
						country: org.country,
						subscribed: true
					},
					signatureDetails: {
						channel: {
							type: 'petitionPage'
						}
					}
				});
			});

			return {
				success: true,
				message: 'Thank you for signing this petition!'
			};
		} catch (err) {
			log.error({ err, organizationSlug, petitionSlug }, 'Error signing petition');
			return fail(500, {
				error: err instanceof Error ? err.message : 'An error occurred while signing the petition',
				success: false
			});
		}
	}
};
