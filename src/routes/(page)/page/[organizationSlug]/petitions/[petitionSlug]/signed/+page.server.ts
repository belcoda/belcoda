import { error } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { petition, petitionSignature, organization, person } from '$lib/schema/drizzle';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import LexicalHtmlRenderer from '@tryghost/kg-lexical-html-renderer';
import type { SerializedEditorState } from 'lexical';
import pino from '$lib/pino';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { getSurveySchema } from '$lib/schema/survey/questions';

const log = pino(import.meta.url);
const lexicalRenderer = new LexicalHtmlRenderer();

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
		.where(eq(petitionSignature.petitionId, petitionData.id));

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

	let renderedDescription: string | null = null;
	const petitionDescription = petitionData.description as SerializedEditorState | null;
	if (petitionDescription?.root?.children?.length) {
		try {
			renderedDescription = await lexicalRenderer.render(petitionDescription);
		} catch (err) {
			log.warn({ err, petitionId: petitionData.id }, 'Failed to render petition description');
			renderedDescription = null;
		}
	}

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
