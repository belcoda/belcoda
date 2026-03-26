import {
	convertWhatsappMessageToApiFormat,
	convertWhatsAppTemplateMessageToApiFormat,
	createMessageFromTemplateAndTemplateMessage,
	convertNodeToFullMessage
} from './ycloud/convert_outbound';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import {
	organization as organizationTable,
	whatsappMessage as whatsappMessageTable,
	whatsappTemplate as whatsappTemplateTable
} from '$lib/schema/drizzle';
import { sendWhatsappMessage as sendWhatsappMessageToYCloud } from './ycloud/ycloud_api';
import type { WhatsappTemplateMessageData, WhatsappMessageData } from '$lib/schema/flow';

import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { v7 as uuidv7 } from 'uuid';
import { env as publicEnv } from '$env/dynamic/public';
import { createActivityWhatsAppMessageOutgoing } from '$lib/server/api/data/activity/activity';
import { updateLatestActivity } from '$lib/server/api/data/person/latestActivity';

type WhatsappMessage =
	| ReturnType<typeof convertWhatsappMessageToApiFormat>
	| ReturnType<typeof convertWhatsAppTemplateMessageToApiFormat>;

export async function sendWhatsappMessage({
	message,
	personId,
	sendingUserId,
	threadId,
	nodeId,
	messageId,
	organizationId
}: {
	message: WhatsappMessageData;
	organizationId: string;
	threadId: string;
	nodeId: string;
	messageId: string;
	personId: string;
	sendingUserId?: string;
}) {
	const whatsappMessageId = uuidv7();
	await db.transaction(async (tx) => {
		const organization = await getOrganizationByIdUnsafe({
			organizationId,
			tx
		});
		const whatsappMessage = convertNodeToFullMessage({
			messageNode: message,
			messageId: whatsappMessageId
		});
		const messageToSend = await convertWhatsappMessageToApiFormat({
			whatsappMessage: whatsappMessage,
			nodeId: nodeId,
			whatsappThreadId: threadId,
			whatsappMessageId: whatsappMessageId,
			from: organization.settings.whatsApp.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER,
			to: personId
		});
		const ycloudResponseId = await sendWhatsappMessageToYCloud(messageToSend);
		if (!ycloudResponseId) {
			throw new Error('Failed to send message to YCloud');
		}
		const messageToInsert: typeof whatsappMessageTable.$inferInsert = {
			id: messageId,
			organizationId: organization.id,
			personId: personId,
			userId: sendingUserId,
			type: 'outgoing_api_message',
			message: whatsappMessage,
			externalId: ycloudResponseId,
			status: 'pending',
			wamidId: null,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		await tx.dbTransaction.wrappedTransaction.insert(whatsappMessageTable).values(messageToInsert);
		//insert activity
		await createActivityWhatsAppMessageOutgoing({
			organizationId: organization.id,
			personId: personId,
			referenceId: messageId,
			tx
		});
		await updateLatestActivity({
			tx,
			args: {
				personId: personId,
				organizationId: organization.id,
				activityPreview: {
					type: 'whatsapp_message_outgoing',
					message: whatsappMessage,
					whatsappMessageId: whatsappMessageId
				}
			}
		});
	});
}

export async function sendWhatsappTemplateMessage({
	message,
	personId,
	sendingUserId,
	threadId,
	nodeId,
	templateId,
	messageId,
	organizationId
}: {
	message: WhatsappTemplateMessageData;
	organizationId: string;
	templateId: string;
	threadId: string;
	personId: string;
	nodeId: string;
	messageId: string;
	sendingUserId?: string;
}) {
	await db.transaction(async (tx) => {
		const template = await tx.dbTransaction.wrappedTransaction.query.whatsappTemplate.findFirst({
			where: and(
				eq(whatsappTemplateTable.id, templateId),
				eq(whatsappTemplateTable.organizationId, organizationId)
			)
		});
		if (!template) {
			throw new Error('Template not found');
		}
		const organization = await getOrganizationByIdUnsafe({
			organizationId,
			tx
		});
		const whatsappMessageId = uuidv7();
		const messageToSend = await convertWhatsAppTemplateMessageToApiFormat({
			templateMessage: message,
			nodeId: nodeId,
			whatsappThreadId: threadId,
			whatsappMessageId: whatsappMessageId,
			from: organization.settings.whatsApp.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER,
			to: personId,
			name: template.name,
			language: template.locale
		});

		const ycloudResponseId = await sendWhatsappMessageToYCloud(messageToSend);
		if (!ycloudResponseId) {
			throw new Error('Failed to send message to YCloud');
		}
		const combinedTemplateMessage = createMessageFromTemplateAndTemplateMessage({
			templateMessage: message,
			template: template.components,
			messageId: whatsappMessageId,
			threadId: threadId
		});
		const messageToInsert: typeof whatsappMessageTable.$inferInsert = {
			id: messageId,
			organizationId: organization.id,
			personId: personId,
			userId: sendingUserId,
			type: 'outgoing_api_message',
			status: 'pending',
			message: combinedTemplateMessage,
			externalId: ycloudResponseId,
			wamidId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			readAt: null,
			deliveredAt: null
		};
		await tx.dbTransaction.wrappedTransaction.insert(whatsappMessageTable).values(messageToInsert);

		//insert activity
		await createActivityWhatsAppMessageOutgoing({
			organizationId: organization.id,
			personId: personId,
			referenceId: messageId,
			tx
		});

		await updateLatestActivity({
			tx,
			args: {
				personId: personId,
				organizationId: organization.id,
				activityPreview: {
					type: 'whatsapp_message_outgoing',
					message: combinedTemplateMessage,
					whatsappMessageId: whatsappMessageId
				}
			}
		});
	});
}
