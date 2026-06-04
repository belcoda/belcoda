import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { drizzle } from '$lib/server/db';
import * as schema from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body: unknown = await request.json();
	if (!isSeedPersonNotesBody(body)) {
		throw error(400, 'personId must be a string and count must be a number');
	}

	const person = await drizzle.query.person.findFirst({
		where: eq(schema.person.id, body.personId)
	});
	if (!person) {
		throw error(404, 'Person not found');
	}

	const owner = await drizzle.query.member.findFirst({
		where: and(
			eq(schema.member.organizationId, person.organizationId),
			eq(schema.member.role, 'owner')
		)
	});
	if (!owner) {
		throw error(404, 'Organization owner not found');
	}

	const count = Math.max(1, Math.min(Math.trunc(body.count), 100));
	const runId = crypto.randomUUID();
	const now = Date.now();
	const rows: (typeof schema.personNote.$inferInsert)[] = Array.from(
		{ length: count },
		(_, index) => {
			const createdAt = new Date(now - index * 1000);
			return {
				id: crypto.randomUUID(),
				organizationId: person.organizationId,
				personId: person.id,
				note: `E2E pagination note ${runId}-${index + 1}`,
				userId: owner.userId,
				createdAt,
				updatedAt: createdAt
			};
		}
	);

	const inserted = await drizzle
		.insert(schema.personNote)
		.values(rows)
		.returning({ id: schema.personNote.id });

	return json({
		success: true,
		count: inserted.length,
		personId: person.id,
		organizationId: person.organizationId,
		noteIds: inserted.map((note) => note.id)
	});
};

function isSeedPersonNotesBody(body: unknown): body is { personId: string; count: number } {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return false;
	}
	const maybeBody = body as Record<string, unknown>;
	return (
		typeof maybeBody.personId === 'string' &&
		typeof maybeBody.count === 'number' &&
		Number.isFinite(maybeBody.count)
	);
}
