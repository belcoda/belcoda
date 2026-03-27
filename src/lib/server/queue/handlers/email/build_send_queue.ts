import { db } from '$lib/server/db';
import { emailMessage } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { getQueue } from '$lib/server/queue';
import { getPersonIdsFromFilter } from '$lib/server/utils/person/filter';
import pino from '$lib/pino';
import type { QueryContext } from '$lib/zero/schema';

const log = pino(import.meta.url);

export async function buildEmailMessageSendQueue({
	emailMessageId,
	organizationId
}: {
	emailMessageId: string;
	organizationId: string;
}) {
	log.debug({ emailMessageId, organizationId }, 'Processing email message');

	await db.transaction(async (tx) => {
		const [email] = await tx.dbTransaction.wrappedTransaction
			.update(emailMessage)
			.set({
				startedAt: new Date()
			})
			.where(
				and(eq(emailMessage.id, emailMessageId), eq(emailMessage.organizationId, organizationId))
			)
			.returning();
		if (!email) {
			throw new Error('Email message not found');
		}

		const ctx: QueryContext = {
			userId: email.sentBy || '',
			authTeams: [],
			adminOrgs: [organizationId],
			ownerOrgs: [],
			otherOrgs: []
		};

		const personIds = await getPersonIdsFromFilter({
			filter: email.recipients,
			organizationId,
			ctx
		});

		const estimatedCount = personIds.length;

		const [updatedEmailWithCount] = await tx.dbTransaction.wrappedTransaction
			.update(emailMessage)
			.set({
				estimatedRecipientCount: estimatedCount,
				updatedAt: new Date()
			})
			.where(
				and(eq(emailMessage.id, emailMessageId), eq(emailMessage.organizationId, organizationId))
			)
			.returning();
		if (!updatedEmailWithCount) {
			throw new Error('Failed to update email message with estimated recipient count');
		}
		if (estimatedCount === 0) {
			log.debug({ emailMessageId }, 'No recipients found for email');
			await tx.dbTransaction.wrappedTransaction
				.update(emailMessage)
				.set({
					completedAt: new Date(),
					updatedAt: new Date()
				})
				.where(
					and(eq(emailMessage.id, emailMessageId), eq(emailMessage.organizationId, organizationId))
				);
			return;
		}
		const queue = await getQueue();
		for (const personId of personIds) {
			await queue.sendEmailMessage({
				emailMessageId,
				organizationId,
				personId,
				sentByUserId: email.sentBy || undefined
			});
		}
	});
}
