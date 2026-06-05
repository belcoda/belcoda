import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { defaultPetitionSettings } from '$lib/schema/petition/settings';
import { eq } from 'drizzle-orm';
import { isE2EOrganizationSlug } from '../../../../../../e2e/helpers/test-data';

const E2E_PETITIONS_ORG_SLUG = 'e2e-petitions-org';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body: unknown = await request.json();
	if (!isSeedPetitionsBody(body)) {
		throw error(400, 'count must be a number and organizationId must be a string when provided');
	}

	let organizationId = body.organizationId ?? locals.session?.session.activeOrganizationId ?? null;
	if (!organizationId) {
		const organization = await drizzle.query.organization.findFirst({
			where: eq(schema.organization.slug, E2E_PETITIONS_ORG_SLUG)
		});
		if (!organization) {
			throw error(404, 'E2E petitions organization not found');
		}
		organizationId = organization.id;
	}

	const organization = await drizzle.query.organization.findFirst({
		where: eq(schema.organization.id, organizationId)
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
	const settings = defaultPetitionSettings();

	const rows: (typeof schema.petition.$inferInsert)[] = Array.from(
		{ length: count },
		(_, index) => {
			const createdAt = new Date(now - index * 1000);
			return {
				id: crypto.randomUUID(),
				organizationId,
				teamId: null,
				pointPersonId: null,
				slug: `e2e-pagination-${runId}-${index + 1}`,
				title: `E2E pagination petition ${runId}-${index + 1}`,
				shortDescription: 'Seeded for E2E petitions sidebar pagination',
				description: null,
				published: false,
				petitionTarget: 'E2E pagination target',
				petitionText: 'Seeded petition text',
				featureImage: null,
				settings,
				createdAt,
				updatedAt: createdAt
			};
		}
	);

	const inserted = await drizzle
		.insert(schema.petition)
		.values(rows)
		.returning({ id: schema.petition.id });

	return json({
		success: true,
		runId,
		count: inserted.length,
		organizationId,
		petitionIds: inserted.map((petition) => petition.id)
	});
};

function isSeedPetitionsBody(
	body: unknown
): body is { count: number; organizationId?: string | null } {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return false;
	}
	const maybeBody = body as Record<string, unknown>;
	return (
		typeof maybeBody.count === 'number' &&
		Number.isFinite(maybeBody.count) &&
		(maybeBody.organizationId === undefined ||
			maybeBody.organizationId === null ||
			typeof maybeBody.organizationId === 'string')
	);
}
