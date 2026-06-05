import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { isE2EOrganizationSlug } from '../../../../../../e2e/helpers/test-data';

const E2E_COMMUNITY_ORG_SLUG = 'e2e-community-org';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body: unknown = await request.json();
	if (!isSeedTeamsBody(body)) {
		throw error(400, 'count must be a number and organizationId must be a string when provided');
	}

	let organizationId = body.organizationId ?? locals.session?.session.activeOrganizationId ?? null;
	if (!organizationId) {
		const organization = await drizzle.query.organization.findFirst({
			where: eq(schema.organization.slug, E2E_COMMUNITY_ORG_SLUG)
		});
		if (!organization) {
			throw error(404, 'E2E community organization not found');
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
	const rows: (typeof schema.team.$inferInsert)[] = Array.from({ length: count }, (_, index) => {
		const createdAt = new Date(now - (count - index - 1) * 1000);
		return {
			id: crypto.randomUUID(),
			organizationId,
			name: `E2E pagination team ${runId}-${index + 1}`,
			parentTeamId: null,
			createdAt,
			updatedAt: createdAt
		};
	});

	const inserted = await drizzle.insert(schema.team).values(rows).returning({ id: schema.team.id });

	return json({
		success: true,
		runId,
		count: inserted.length,
		organizationId,
		teamIds: inserted.map((team) => team.id)
	});
};

function isSeedTeamsBody(body: unknown): body is { count: number; organizationId?: string | null } {
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
