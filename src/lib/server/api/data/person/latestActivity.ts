import type { ServerTransaction } from '@rocicorp/zero';
import { person } from '$lib/schema/drizzle';
import type { ActivityPreviewPayload } from '$lib/schema/activity/types';
import { and, eq } from 'drizzle-orm';

// update latest activity of a person record

export async function updateLatestActivity({
	tx,
	args
}: {
	tx: ServerTransaction;
	args: {
		personId: string;
		organizationId: string;
		activityPreview: ActivityPreviewPayload;
	};
}) {
	await tx.dbTransaction.wrappedTransaction
		.update(person)
		.set({
			mostRecentActivityPreview: args.activityPreview,
			mostRecentActivityAt: new Date()
		})
		.where(and(eq(person.id, args.personId), eq(person.organizationId, args.organizationId)));
}
