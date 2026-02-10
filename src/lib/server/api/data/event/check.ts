import { drizzle } from '$lib/server/db';
import { eq, isNull, and, not } from 'drizzle-orm';
import { actionCode, event } from '$lib/schema/drizzle';
export async function checkEventSlug({
	slug,
	organizationId,
	excludeEventId
}: {
	slug: string;
	organizationId: string;
	excludeEventId?: string;
}) {
	const where = [
		eq(event.organizationId, organizationId),
		isNull(event.deletedAt),
		eq(event.slug, slug)
	];
	if (excludeEventId) {
		where.push(not(eq(event.id, excludeEventId)));
	}
	const result = await db.query.event.findFirst({
		where: and(...where)
	});
	return result ? true : false;
}
export async function checkEventTitle({
	title,
	organizationId,
	excludeEventId
}: {
	title: string;
	organizationId: string;
	excludeEventId?: string;
}) {
	const where = [
		eq(event.organizationId, organizationId),
		isNull(event.deletedAt),
		eq(event.title, title)
	];
	if (excludeEventId) {
		where.push(not(eq(event.id, excludeEventId)));
	}
	const result = await db.query.event.findFirst({
		where: and(...where)
	});
	return result ? true : false;
}

export async function _getEventActionCodeUnsafe({ eventId }: { eventId: string }) {
	const result = await db.query.actionCode.findFirst({
		where: and(
			eq(actionCode.referenceId, eventId),
			eq(actionCode.type, 'event_signup'),
			isNull(actionCode.deletedAt)
		)
	});
	return result;
}
