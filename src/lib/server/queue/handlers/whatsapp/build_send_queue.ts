import { personWhatsappIdentity, whatsappThread } from '$lib/schema/drizzle';
import { getPersonRecordsFromFilter } from '$lib/server/api/data/person/filter';
import { getQueue } from '$lib/server/queue/index';
import { db } from '$lib/server/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export async function buildWhatsappThreadSendQueue({
	thread,
	sentByUserId
}: {
	thread: typeof whatsappThread.$inferSelect;
	sentByUserId?: string | null;
}) {
	const templateMessageNode = thread.flow.nodes[1]; // second node after targeting
	if (!templateMessageNode) {
		throw new Error('Template message node not found');
	}
	if (templateMessageNode.type !== 'templateMessage') {
		throw new Error('Second node in node array was not a template message node');
	}
	const filterGroup = thread.flow.nodes.find((node) => node.type === 'targeting')?.data.filter;
	if (!filterGroup) {
		throw new Error('Filter group not found');
	}
	const recipients = await db.transaction(async (tx) => {
		return await getPersonRecordsFromFilter({
			filter: filterGroup,
			tx,
			organizationId: thread.organizationId,
			userId: sentByUserId
		});
	});
	const eligibleRecipients = recipients.filter(
		(recipient) => recipient.subscribed && !recipient.doNotContact
	);
	const ineligibleRecipientCount = recipients.length - eligibleRecipients.length;

	if (ineligibleRecipientCount > 0) {
		log.info(
			{
				threadId: thread.id,
				eligibleRecipientCount: eligibleRecipients.length,
				ineligibleRecipientCount
			},
			'Excluded ineligible people from WhatsApp broadcast'
		);
	}

	const recipientIdsWithWhatsappIdentity = new Set(
		await db.transaction(async (tx) => {
			if (eligibleRecipients.length === 0 || !thread.organizationId) {
				return [];
			}
			const rows = await tx.dbTransaction.wrappedTransaction
				.select({ personId: personWhatsappIdentity.personId })
				.from(personWhatsappIdentity)
				.where(
					and(
						isNull(personWhatsappIdentity.deletedAt),
						eq(personWhatsappIdentity.organizationId, thread.organizationId),
						inArray(
							personWhatsappIdentity.personId,
							eligibleRecipients.map((recipient) => recipient.id)
						)
					)
				);
			return rows.map((row) => row.personId);
		})
	);

	const queue = await getQueue();
	for (const recipient of eligibleRecipients) {
		if (recipient.phoneNumber || recipientIdsWithWhatsappIdentity.has(recipient.id)) {
			await queue.processFlowNodeAction({
				nodeId: templateMessageNode.id,
				personId: recipient.id,
				organizationId: thread.organizationId,
				threadId: thread.id
			});
		}
	}
}
