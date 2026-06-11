import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { defaultEventSettings } from '$lib/schema/event/settings';
import { eq } from 'drizzle-orm';
import { isE2EOrganizationSlug } from '../../../../../../e2e/helpers/test-data';

const E2E_EVENTS_ORG_SLUG = 'e2e-events-org';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body: unknown = await request.json();
	if (!isSeedEventsBody(body)) {
		throw error(400, 'count must be a number and organizationId must be a string when provided');
	}

	let organizationId = body.organizationId ?? locals.session?.session.activeOrganizationId ?? null;
	if (!organizationId) {
		const organization = await drizzle.query.organization.findFirst({
			where: eq(schema.organization.slug, E2E_EVENTS_ORG_SLUG)
		});
		if (!organization) {
			throw error(404, 'E2E events organization not found');
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
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
	const monthSpanMs = monthEnd.getTime() - monthStart.getTime();
	const settings = defaultEventSettings();

	const rows: (typeof schema.event.$inferInsert)[] = Array.from({ length: count }, (_, index) => {
		const startsAt = new Date(
			monthStart.getTime() + Math.floor((monthSpanMs * index) / Math.max(count, 1))
		);
		const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
		const createdAt = now;
		return {
			id: crypto.randomUUID(),
			organizationId,
			teamId: null,
			slug: `e2e-pagination-${runId}-${index + 1}`,
			title: `E2E pagination event ${runId}-${index + 1}`,
			shortDescription: 'Seeded for E2E events sidebar pagination',
			description: null,
			published: false,
			startsAt,
			endsAt,
			onlineLink: null,
			addressLine1: null,
			addressLine2: null,
			locality: null,
			region: null,
			postcode: null,
			country: 'US',
			timezone: 'America/New_York',
			maxSignups: null,
			featureImage: null,
			settings,
			signupTag: null,
			attendanceTag: null,
			createdAt,
			updatedAt: createdAt
		};
	});

	const inserted = await drizzle
		.insert(schema.event)
		.values(rows)
		.returning({ id: schema.event.id });

	return json({
		success: true,
		runId,
		count: inserted.length,
		organizationId,
		eventIds: inserted.map((event) => event.id)
	});
};

function isSeedEventsBody(
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
