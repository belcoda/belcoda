import { db } from '$lib/server/db';
import { eq, and, isNull } from 'drizzle-orm';
import { event } from '$lib/schema/drizzle';
import type { Transaction } from '$lib/server/db/zeroDrizzle';

export async function _getEventBySlugUnsafe({
	eventSlug,
	organizationId
}: {
	eventSlug: string;
	organizationId: string;
}) {
	const eventObject = await db.query.event.findFirst({
		where: and(
			eq(event.slug, eventSlug),
			eq(event.organizationId, organizationId),
			isNull(event.deletedAt)
		)
	});
	return eventObject;
}

export async function _getEventByIdUnsafe({ eventId, tx }: { eventId: string; tx: Transaction }) {
	const [eventObject] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(event)
		.where(and(eq(event.id, eventId), isNull(event.deletedAt)));
	if (!eventObject) {
		throw new Error('Event not found');
	}
	return eventObject;
}
