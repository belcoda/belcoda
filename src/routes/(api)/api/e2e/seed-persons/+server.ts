import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { DEFAULT_SOCIAL_MEDIA } from '$lib/schema/person/meta';
import { eq } from 'drizzle-orm';
import { isE2EOrganizationSlug } from '../../../../../../e2e/helpers/test-data';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body: unknown = await request.json();
	if (!isSeedPersonsBody(body)) {
		throw error(
			400,
			'count must be a number and organizationId or organizationSlug must be provided when no active organization is available'
		);
	}

	const organizationId = await resolveOrganizationId(
		body,
		locals.session?.session.activeOrganizationId
	);

	const organization = await drizzle.query.organization.findFirst({
		where: eq(schema.organization.id, organizationId)
	});
	if (!organization) {
		throw error(404, 'Organization not found');
	}
	if (!isE2EOrganizationSlug(organization.slug)) {
		throw error(403, 'This endpoint can only seed E2E fixture organizations');
	}

	const count = Math.max(1, Math.min(Math.trunc(body.count), 200));
	const runId = crypto.randomUUID();
	const now = new Date();
	const rows: (typeof schema.person.$inferInsert)[] = Array.from({ length: count }, (_, index) => ({
		id: crypto.randomUUID(),
		organizationId,
		givenName: `Pagination ${index + 1}`,
		familyName: 'Person',
		country: 'US',
		preferredLanguage: 'en',
		emailAddress: `e2e-pagination-${runId}-${index + 1}@belcoda.test`,
		subscribed: true,
		doNotContact: false,
		socialMedia: DEFAULT_SOCIAL_MEDIA,
		externalId: `e2e-pagination-${runId}-${index + 1}`,
		mostRecentActivityAt: now,
		mostRecentActivityPreview: null,
		addedFrom: { type: 'seeds' },
		createdAt: now,
		updatedAt: now
	}));

	const inserted = await drizzle
		.insert(schema.person)
		.values(rows)
		.returning({ id: schema.person.id });

	return json({
		success: true,
		count: inserted.length,
		organizationId,
		personIds: inserted.map((person) => person.id)
	});
};

async function resolveOrganizationId(
	body: { organizationId?: string | null; organizationSlug?: string | null },
	sessionOrganizationId?: string | null
): Promise<string> {
	if (body.organizationId) {
		return body.organizationId;
	}
	if (body.organizationSlug) {
		const organization = await drizzle.query.organization.findFirst({
			where: eq(schema.organization.slug, body.organizationSlug)
		});
		if (!organization) {
			throw error(404, 'Organization not found');
		}
		return organization.id;
	}
	if (sessionOrganizationId) {
		return sessionOrganizationId;
	}
	throw error(400, 'organizationId or organizationSlug is required');
}

function isSeedPersonsBody(body: unknown): body is {
	count: number;
	organizationId?: string | null;
	organizationSlug?: string | null;
} {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return false;
	}
	const maybeBody = body as Record<string, unknown>;
	return (
		typeof maybeBody.count === 'number' &&
		Number.isFinite(maybeBody.count) &&
		(maybeBody.organizationId === undefined ||
			maybeBody.organizationId === null ||
			typeof maybeBody.organizationId === 'string') &&
		(maybeBody.organizationSlug === undefined ||
			maybeBody.organizationSlug === null ||
			typeof maybeBody.organizationSlug === 'string')
	);
}
