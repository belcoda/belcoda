import { db } from '$lib/server/db';
import { activity, person } from '$lib/schema/drizzle';
import { type ActivityType } from '$lib/schema/activity/types';
import { and, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { generatePreview } from '$lib/server/api/utils/activity/generate_preview';
export async function insertActivity({
	organizationId,
	personId,
	userId,
	type,
	referenceId,
	unread
}: {
	organizationId: string;
	personId: string;
	type: ActivityType;
	userId?: string | null;
	referenceId: string;
	unread: boolean;
}) {
	//check that personId belongs to the organization
	const personResult = await db.query.person.findFirst({
		where: (row, { and, eq }) => and(eq(row.id, personId), eq(row.organizationId, organizationId))
	});
	if (!personResult) {
		throw new Error('Person not found in the organization. Cannot insert activity.');
	}
	const activityInsert: typeof activity.$inferInsert = {
		id: uuidv7(),
		organizationId,
		personId,
		type,
		referenceId,
		unread,
		userId: userId || null,
		createdAt: new Date()
	};
	await db.insert(activity).values(activityInsert);

	const preview = await generatePreview({ type, referenceId });
	await db
		.update(person)
		.set({
			mostRecentActivityPreview: preview,
			mostRecentActivityAt: new Date()
		})
		.where(and(eq(person.id, personId), eq(person.organizationId, organizationId)));
}
