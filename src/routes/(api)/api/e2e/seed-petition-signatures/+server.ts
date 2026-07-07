import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { DEFAULT_SOCIAL_MEDIA } from '$lib/schema/person/meta';
import { eq } from 'drizzle-orm';
import { isE2EOrganizationSlug } from '../../../../../../e2e/helpers/test-data';

export const POST: RequestHandler = async ({ request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body: unknown = await request.json();
	if (!isSeedPetitionSignaturesBody(body)) {
		throw error(400, 'petitionId must be a string and count must be a number');
	}

	const petition = await drizzle.query.petition.findFirst({
		where: eq(schema.petition.id, body.petitionId)
	});
	if (!petition) {
		throw error(404, 'Petition not found');
	}

	const organization = await drizzle.query.organization.findFirst({
		where: eq(schema.organization.id, petition.organizationId)
	});
	if (!organization) {
		throw error(404, 'Organization not found');
	}
	if (!isE2EOrganizationSlug(organization.slug)) {
		throw error(403, 'This endpoint can only seed E2E fixture organizations');
	}

	const count = Math.max(1, Math.min(Math.trunc(body.count), 100));
	const runId = crypto.randomUUID();
	const now = Date.now();

	const personRows: (typeof schema.person.$inferInsert)[] = Array.from(
		{ length: count },
		(_, index) => {
			const createdAt = new Date(now - index * 1000);
			const personId = crypto.randomUUID();
			return {
				id: personId,
				organizationId: petition.organizationId,
				givenName: 'E2E',
				familyName: `Signature ${runId}-${index + 1}`,
				country: 'US',
				preferredLanguage: 'en',
				emailAddress: `e2e-petition-signature-${runId}-${index + 1}@belcoda.test`,
				subscribed: true,
				doNotContact: false,
				socialMedia: DEFAULT_SOCIAL_MEDIA,
				externalId: `e2e-petition-signature-${runId}-${index + 1}`,
				mostRecentActivityAt: createdAt,
				mostRecentActivityPreview: null,
				addedFrom: { type: 'seeds' },
				createdAt,
				updatedAt: createdAt
			};
		}
	);

	const signatureRows: (typeof schema.petitionSignature.$inferInsert)[] = personRows.map(
		(person, index) => {
			const createdAt = person.createdAt ?? new Date(now - index * 1000);
			return {
				id: crypto.randomUUID(),
				organizationId: petition.organizationId,
				teamId: petition.teamId,
				petitionId: petition.id,
				personId: person.id!,
				details: { channel: { type: 'adminPanel' as const }, customFields: {} },
				createdAt,
				updatedAt: createdAt
			};
		}
	);

	await drizzle.insert(schema.person).values(personRows);
	const inserted = await drizzle
		.insert(schema.petitionSignature)
		.values(signatureRows)
		.returning({ id: schema.petitionSignature.id });

	return json({
		success: true,
		runId,
		count: inserted.length,
		petitionId: petition.id,
		organizationId: petition.organizationId,
		signatureIds: inserted.map((signature) => signature.id),
		personIds: personRows.map((person) => person.id)
	});
};

function isSeedPetitionSignaturesBody(
	body: unknown
): body is { petitionId: string; count: number } {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return false;
	}
	const maybeBody = body as Record<string, unknown>;
	return (
		typeof maybeBody.petitionId === 'string' &&
		typeof maybeBody.count === 'number' &&
		Number.isFinite(maybeBody.count)
	);
}
