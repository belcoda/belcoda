import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { db, drizzle } from '$lib/server/db';
import { petition, petitionSignature, organization, person } from '$lib/schema/drizzle';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import pino from '$lib/pino';
import { signPetitionHelper } from '$lib/server/api/data/petition/signature';
import { getAdminOwnerOrgs } from '$lib/server/api/utils/auth/permissions';
import { _getPetitionActionCodeUnsafe } from '$lib/server/api/data/petition/check';
import { generateWhatsAppPetitionLink } from '$lib/utils/petitions/link';
import { LexicalHTMLRenderer as LexicalHtmlRenderer } from '@tryghost/kg-lexical-html-renderer';
import type { SerializedEditorState } from 'lexical';
import { sanitize, clearWindow } from 'isomorphic-dompurify';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { getSurveySchema } from '$lib/schema/survey/questions';
const log = pino(import.meta.url);
const lexicalRenderer = new LexicalHtmlRenderer();

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

	const session = locals.session;
	const userId = session?.user?.id;

	// The organization → petition lookups above are sequential (petition depends on org). The
	// remaining reads are independent of one another, so batch them into a single round of
	// concurrent queries instead of awaiting one after another.
	const [signatureCountRows, recentSignatures, actionCode, adminOwnerOrgs] = await Promise.all([
		// Count signatures
		drizzle
			.select({ count: count() })
			.from(petitionSignature)
			.where(
				and(eq(petitionSignature.petitionId, petitionData.id), isNull(petitionSignature.deletedAt))
			),
		// Get recent signatures with person details
		drizzle
			.select({
				id: petitionSignature.id,
				createdAt: petitionSignature.createdAt,
				givenName: person.givenName,
				familyName: person.familyName
			})
			.from(petitionSignature)
			.innerJoin(person, eq(petitionSignature.personId, person.id))
			.where(
				and(eq(petitionSignature.petitionId, petitionData.id), isNull(petitionSignature.deletedAt))
			)
			.orderBy(desc(petitionSignature.createdAt))
			.limit(10),
		_getPetitionActionCodeUnsafe({ petitionId: petitionData.id }),
		userId ? getAdminOwnerOrgs(userId) : Promise.resolve(null)
	]);

	const [signatureCount] = signatureCountRows;

	const whatsAppSignupLink = actionCode
		? generateWhatsAppPetitionLink({
				petitionTitle: petitionData.title,
				whatsAppNumber: org.settings?.whatsApp?.number,
				actionCode: actionCode.id
			})
		: null;

	let isAdmin = false;
	if (adminOwnerOrgs) {
		isAdmin = adminOwnerOrgs.admin.includes(org.id) || adminOwnerOrgs.owner.includes(org.id);
	}

	let renderedDescription: string | null = null;
	const petitionDescription = petitionData.description as SerializedEditorState | null;
	if (petitionDescription?.root?.children?.length) {
		try {
			renderedDescription = await lexicalRenderer.render(petitionDescription);
			renderedDescription = sanitize(renderedDescription);
		} catch (err) {
			log.warn({ err, petitionId: petitionData.id }, 'Failed to render petition description');
			renderedDescription = null;
		} finally {
			clearWindow(); //Release JSDom resources to avoid memory accumulation
		}
	}

	// Serialize dates to avoid serialization issues
	const serializedPetition = {
		...petitionData,
		description: renderedDescription,
		createdAt: petitionData.createdAt ? new Date(petitionData.createdAt).getTime() : null,
		updatedAt: petitionData.updatedAt ? new Date(petitionData.updatedAt).getTime() : null,
		deletedAt: petitionData.deletedAt ? new Date(petitionData.deletedAt).getTime() : null,
		archivedAt: petitionData.archivedAt ? new Date(petitionData.archivedAt).getTime() : null
	};

	const serializedSignatures = recentSignatures.map((sig) => ({
		...sig,
		createdAt: sig.createdAt ? new Date(sig.createdAt).getTime() : null
	}));
	const surveySchema = getSurveySchema(petitionData);
	const form = await superValidate(valibot(surveySchema));
	form.data.customFields ||= {};

	return {
		petition: serializedPetition,
		organization: org,
		signatureCount: signatureCount?.count || 0,
		recentSignatures: serializedSignatures,
		session,
		isAdmin,
		whatsAppSignupLink,
		form
	};
}

export const actions = {
	sign: async ({ request, params }) => {
		const { organizationSlug, petitionSlug } = params;

		const [org] = await drizzle
			.select()
			.from(organization)
			.where(eq(organization.slug, organizationSlug))
			.limit(1);

		if (!org) {
			return fail(404, { error: 'Organization not found', success: false });
		}

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
			return fail(404, { error: 'Petition not found', success: false });
		}

		if (!petitionData.published) {
			return fail(400, { error: 'This petition is not published', success: false });
		}

		const surveySchema = getSurveySchema(petitionData);
		const form = await superValidate(request, valibot(surveySchema));
		form.data.customFields ||= {};
		if (!form.valid) {
			return fail(400, { form });
		}
		const layoutParam = form.data.theme;

		try {
			await db.transaction(async (tx) => {
				await signPetitionHelper({
					tx,
					petitionId: petitionData.id,
					organizationId: org.id,
					teamId: petitionData.teamId || undefined,
					personAction: {
						givenName: form.data.person.givenName || null,
						familyName: form.data.person.familyName || null,
						emailAddress: form.data.person.emailAddress || null,
						phoneNumber: form.data.person.phoneNumber || null,
						addressLine1: form.data.person.addressLine1 || null,
						addressLine2: form.data.person.addressLine2 || null,
						locality: form.data.person.locality || null,
						region: form.data.person.region || null,
						postcode: form.data.person.postcode || null,
						dateOfBirth: form.data.person.dateOfBirth || null,
						gender: form.data.person.gender || null,
						workplace: form.data.person.workplace || null,
						position: form.data.person.position || null,
						country: form.data.person.country || org.country || null,
						subscribed: true
					},
					signatureDetails: {
						channel: {
							type: 'petitionPage'
						},
						customFields: form.data.customFields
					}
				});
			});

			const layoutQuery =
				layoutParam === 'embed'
					? '?layout=embed'
					: layoutParam === 'default'
						? '?layout=default'
						: '';

			redirect(303, `/page/${organizationSlug}/petitions/${petitionSlug}/signed${layoutQuery}`);
		} catch (err) {
			if (isRedirect(err)) {
				throw err;
			}
			log.error({ err, organizationSlug, petitionSlug }, 'Error signing petition');
			return fail(500, {
				form,
				error: 'Unable to sign the petition right now. Please try again in a moment.',
				success: false
			});
		}
	}
};
