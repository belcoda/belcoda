import { db, drizzle } from '$lib/server/db';
import { whatsappThread } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { getQueue } from '$lib/server/queue';
import { _addPersonTagData } from '$lib/server/api/data/person/tag';
import { _addPersonTeamDataUnsafe } from '$lib/server/api/data/person/team';
import { signUpForEventWithId } from '$lib/server/api/data/event/signup';
import { signPetitionWithId } from '$lib/server/api/data/petition/signature';
import {
	sendWhatsappMessage,
	sendWhatsappTemplateMessage
} from '$lib/server/utils/whatsapp/send_message';
import { v7 as uuidv7 } from 'uuid';

export async function processFlowNodeAction({
	nodeId,
	personId,
	organizationId,
	threadId
}: {
	nodeId: string;
	personId: string;
	organizationId: string;
	threadId: string;
}) {
	const thread = await drizzle.query.whatsappThread.findFirst({
		where: and(eq(whatsappThread.id, threadId), eq(whatsappThread.organizationId, organizationId))
	});
	if (!thread) {
		throw new Error('Thread not found');
	}
	const node = await thread.flow.nodes.find((node) => node.id === nodeId);

	if (!node) {
		throw new Error('Node not found');
	}

	await db.transaction(async (tx) => {
		switch (node.type) {
			case 'message': {
				await sendWhatsappMessage({
					message: node.data,
					personId,
					organizationId,
					threadId,
					nodeId: node.id,
					messageId: node.id
				});
				break;
			}
			case 'templateMessage': {
				// send template message to ycloud
				await sendWhatsappTemplateMessage({
					message: node.data,
					personId,
					organizationId,
					threadId,
					nodeId: node.id,
					templateId: node.data.templateId,
					messageId: node.id
				});
				break;
			}
			case 'eventSignup': {
				await signUpForEventWithId({
					tx,
					eventId: node.data.eventId,
					personId,
					organizationId,
					signupDetails: {
						channel: { type: 'whatsapp' },
						customFields: {}
					}
				});
				break;
			}
			case 'petitionSignup': {
				await signPetitionWithId({
					tx,
					petitionId: node.data.petitionId,
					personId,
					organizationId,
					signupDetails: {
						channel: { type: 'whatsapp' }
					}
				});
				break;
			}
			case 'tagAdd': {
				await _addPersonTagData({
					tx,
					args: {
						personId,
						tagId: node.data.tagId,
						organizationId
					}
				});
				break;
			}
			case 'teamAdd': {
				await _addPersonTeamDataUnsafe({
					tx,
					args: {
						personId,
						teamId: node.data.teamId,
						organizationId
					}
				});
				break;
			}
			case 'targeting': {
				throw new Error(
					'Targeting are not supported this handler. There probably has been some kind of mistake to reach this code. '
				);
			}
			default: {
				throw new Error(`Unsupported node type (${JSON.stringify(node)})`);
			}
		}
	});
	//check edges for any nodes with source of message id
	const followUpNodes = thread.flow.edges.filter((edge) => edge.source === nodeId);
	for (const followUpNode of followUpNodes) {
		if (followUpNode.sourceHandle) {
			//this means it's a button action, so we don't want to trigger it automatically for those nodes, right? Only on incoming button press
			continue;
		}
		const followUpNodeData = thread.flow.nodes.find((node) => node.id === followUpNode.target);
		if (!followUpNodeData) {
			throw new Error('Follow up node not found');
		}
		// thrigger this function again for the follow up node
		const queue = await getQueue();
		queue.processFlowNodeAction({
			nodeId: followUpNodeData.id,
			personId,
			organizationId,
			threadId
		});
	}
}
