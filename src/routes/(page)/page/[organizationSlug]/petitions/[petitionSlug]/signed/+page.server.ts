import { error } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { petition, petitionSignature, organization, person } from '$lib/schema/drizzle';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import type { SerializedEditorState } from 'lexical';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { getSurveySchema } from '$lib/schema/survey/questions';
import { renderSanitizedDescription } from '$lib/server/utils/lexical/render_sanitized_description';

export const ssr = false;

export async function load({ params }) {
	const { organizationSlug, petitionSlug } = params;

	const [org] = await drizzle
		.select()
		.from(organization)
		.where(eq(organization.slug, organizationSlug))
		.limit(1);

	if (!org) {
		throw error(404, 'Organization not found');
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
		throw error(404, 'Petition not found');
	}

	const [signatureCount] = await drizzle
		.select({ count: count() })
		.from(petitionSignature)
		.where(
			and(eq(petitionSignature.petitionId, petitionData.id), isNull(petitionSignature.deletedAt))
		);

	const recentSignatures = await drizzle
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
		.limit(10);

	// When pageHtml (TipTap) exists it is rendered directly (already sanitized at
	// write time), so skip the legacy Lexical render entirely.
	const renderedDescription = petitionData.pageHtml
		? null
		: await renderSanitizedDescription({
				description: petitionData.description as SerializedEditorState | null,
				logContext: { petitionId: petitionData.id }
			});

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
		session: null,
		isAdmin: false,
		whatsAppSignupLink: null,
		form
	};
}
