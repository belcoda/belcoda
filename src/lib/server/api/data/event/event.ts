import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { event } from '$lib/schema/drizzle';
export async function _getEventBySlugUnsafe({
	eventSlug,
	organizationId
}: {
	eventSlug: string;
	organizationId: string;
}) {
	const eventObject = await db.query.event.findFirst({
		where: and(eq(event.slug, eventSlug), eq(event.organizationId, organizationId))
	});
	return eventObject;
}
