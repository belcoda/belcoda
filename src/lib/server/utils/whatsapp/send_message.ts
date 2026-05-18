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
	person,
	user as userTable,
	whatsappMessage as whatsappMessageTable,
	whatsappTemplate as whatsappTemplateTable
} from '$lib/schema/drizzle';
import { _getPersonByIdUnsafe } from '$lib/server/api/data/person/person';
import { sendWhatsappMessage as sendWhatsappMessageToYCloud } from './ycloud/ycloud_api';
import type { WhatsappTemplateMessageData, WhatsappMessageData } from '$lib/schema/flow';
import type { TemplateMessageComponents } from '$lib/schema/whatsapp/template';

import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { v7 as uuidv7 } from 'uuid';
import { env as publicEnv } from '$env/dynamic/public';
import { createActivityWhatsAppMessageOutgoing } from '$lib/server/api/data/activity/activity';
import { updateLatestActivity } from '$lib/server/api/data/person/latestActivity';
import {
	resolveTemplateParamSources,
	type TemplateVariableValueMap
} from '$lib/utils/template-variables';

type WhatsappMessage =
	| ReturnType<typeof convertWhatsappMessageToApiFormat>
	| ReturnType<typeof convertWhatsAppTemplateMessageToApiFormat>;

function buildTemplateVariableValues({
	personObject,
	organization,
	sender
}: {
	personObject: typeof person.$inferSelect;
	organization: typeof organizationTable.$inferSelect;
	sender?: typeof userTable.$inferSelect | null;
}): TemplateVariableValueMap {
	return {
		'person.given_name': personObject.givenName,
		'person.family_name': personObject.familyName,
		'person.email_address': personObject.emailAddress,
		'person.phone_number': personObject.phoneNumber,
		'organization.name': organization.name,
		'organization.slug': organization.slug,
		'sender.name': sender?.name,
		'sender.email': sender?.email
	};
}

function resolveWhatsappTemplateMessageData({
	message,
	template,
	values
}: {
	message: WhatsappTemplateMessageData;
	template: TemplateMessageComponents;
	values: TemplateVariableValueMap;
}): WhatsappTemplateMessageData {
	const templateHeader = template.find((component) => component.type === 'HEADER');
	const templateBody = template.find((component) => component.type === 'BODY');

	return {
		...message,
		header:
			templateHeader && message.header
				? {
						...message.header,
						templateStrings: resolveTemplateParamSources({
							templateParams: message.header.templateParams,
							templateStrings: message.header.templateStrings,
							values
						})
					}
				: undefined,
		body:
			templateBody && message.body
				? {
						...message.body,
						templateStrings: resolveTemplateParamSources({
							templateParams: message.body.templateParams,
							templateStrings: message.body.templateStrings,
							values
						})
					}
				: undefined
	};
}

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
		const personObject = await _getPersonByIdUnsafe({
			personId: personId,
			organizationId: organizationId,
			tx
		});
		if (!personObject) {
			throw new Error('Person not found');
		}
		const to = personObject.whatsAppUsername || personObject.phoneNumber;
		if (!to) {
			throw new Error('Person does not have a WhatsApp username or phone number');
		}
		const messageToSend = await convertWhatsappMessageToApiFormat({
			whatsappMessage: whatsappMessage,
			nodeId: nodeId,
			whatsappThreadId: threadId,
			whatsappMessageId: whatsappMessageId,
			from: organization.settings.whatsApp.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER,
			to: to
		});
		const ycloudResponseId = await sendWhatsappMessageToYCloud(messageToSend);
		if (!ycloudResponseId) {
			throw new Error('Failed to send message to YCloud');
		}
		const messageToInsert: typeof whatsappMessageTable.$inferInsert = {
			id: whatsappMessageId,
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
			referenceId: whatsappMessageId,
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
		const personObject = await _getPersonByIdUnsafe({
			personId: personId,
			organizationId: organizationId,
			tx
		});
		if (!personObject) {
			throw new Error('Person not found');
		}
		const senderObject = sendingUserId
			? await tx.dbTransaction.wrappedTransaction.query.user.findFirst({
					where: eq(userTable.id, sendingUserId)
				})
			: null;
		const to = personObject.whatsAppUsername || personObject.phoneNumber;
		if (!to) {
			throw new Error('Person does not have a WhatsApp username or phone number');
		}
		const whatsappMessageId = uuidv7();
		const resolvedMessage = resolveWhatsappTemplateMessageData({
			message,
			template: template.components,
			values: buildTemplateVariableValues({
				personObject,
				organization,
				sender: senderObject
			})
		});
		const messageToSend = await convertWhatsAppTemplateMessageToApiFormat({
			templateMessage: resolvedMessage,
			nodeId: nodeId,
			whatsappThreadId: threadId,
			whatsappMessageId: whatsappMessageId,
			from: organization.settings.whatsApp.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER,
			to: to,
			name: template.name,
			language: template.locale
		});

		const ycloudResponseId = await sendWhatsappMessageToYCloud(messageToSend);
		if (!ycloudResponseId) {
			throw new Error('Failed to send message to YCloud');
		}
		const combinedTemplateMessage = createMessageFromTemplateAndTemplateMessage({
			templateMessage: resolvedMessage,
			template: template.components,
			messageId: whatsappMessageId,
			threadId: threadId
		});
		const messageToInsert: typeof whatsappMessageTable.$inferInsert = {
			id: whatsappMessageId,
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
			referenceId: whatsappMessageId,
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
