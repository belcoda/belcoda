import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { whatsappThread } from '$lib/schema/drizzle';
import { getPersonRecordsFromFilter } from '$lib/server/api/data/person/filter';
import { getQueue } from '$lib/server/queue/index';
export async function buildSendQueue({
	whatsappThreadId,
	sentByUserId
}: {
	whatsappThreadId: string;
	sentByUserId: string;
}) {
	await db.transaction(async (tx) => {
		const thread = await tx.dbTransaction.wrappedTransaction.query.whatsappThread.findFirst({
			where: eq(whatsappThread.id, whatsappThreadId)
		});
		if (!thread) {
			throw new Error('Thread not found');
		}
		const templateMessageNode = thread.flow.nodes[1]; //it should always be the second node, after the targeting node first...
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
		const recipients = await getPersonRecordsFromFilter({
			filter: filterGroup,
			tx,
			organizationId: thread.organizationId,
			userId: sentByUserId
		});

		const queue = await getQueue();
		for (const recipient of recipients) {
			if (recipient.phoneNumber || recipient.whatsAppUsername) {
				await queue.processFlowNodeAction({
					nodeId: templateMessageNode.id,
					personId: recipient.id,
					organizationId: thread.organizationId,
					threadId: thread.id
				});
			}
		}
	});
}
