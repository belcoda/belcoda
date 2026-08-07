import {
	findActiveWhatsappIdentitiesByPersonAndAccountIdUnsafe,
	upsertWhatsappIdentityForPersonUnsafe
} from '$lib/server/api/data/whatsapp/identity';
import { _getPersonByIdUnsafe } from '$lib/server/api/data/person/person';
import type { ServerTransaction } from '@rocicorp/zero';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { v7 as uuidv7 } from 'uuid';
import { type WhatsappMessage } from '$lib/schema/whatsapp/message';
import { db } from '$lib/server/db';
import { convertOutboundMessage } from '$lib/server/utils/whatsapp/linkeddevice/convert_outbound';
import { sendWhatsappMessageToLinkedDeviceGateway } from '$lib/server/utils/whatsapp/linkeddevice/linkeddevice_api';
import { whatsappMessage as whatsappMessageTable } from '$lib/schema/drizzle';
import { createActivityWhatsAppMessageOutgoing } from '$lib/server/api/data/activity/activity';
import { updateLatestActivity } from '$lib/server/api/data/person/latestActivity';

export async function getJidFromPhoneNumber({ phoneNumber }: { phoneNumber: string }) {
	//return jid...
	return `91${phoneNumber}`;
}

export async function resolveWhatsappIdentity({
	personId,
	whatsappAccountId,
	organizationId,
	tx
}: {
	personId: string;
	organizationId: string;
	tx: ServerTransaction;
	whatsappAccountId: string;
}) {
	//return identity...
	const identities = await findActiveWhatsappIdentitiesByPersonAndAccountIdUnsafe({
		personId,
		organizationId,
		accountId: whatsappAccountId,
		tx
	});
	if (identities.length === 0) {
		return await createWhatsappIdentityFromPhoneNumber({
			personId,
			organizationId,
			accountId: whatsappAccountId,
			tx
		});
	}
	const jidIdentity = identities.find((identity) => identity.jid);
	if (!jidIdentity) {
		const phoneNumberIdentity = identities.find((identity) => identity.waPhone);
		if (phoneNumberIdentity && phoneNumberIdentity.waPhone) {
			const jid = await getJidFromPhoneNumber({ phoneNumber: phoneNumberIdentity.waPhone });
			if (!jid) {
				// it seems that whatever phone number is on the identity is not valid, so let's create a new one from the personId if we can...
				return await createWhatsappIdentityFromPhoneNumber({
					personId,
					organizationId,
					accountId: whatsappAccountId,
					tx
				});
			}
			return await createWhatsappIdentity({
				personId,
				organizationId,
				whatsappAccountId,
				jid: jid,
				tx
			});
		} else {
			return await createWhatsappIdentityFromPhoneNumber({
				personId,
				organizationId,
				accountId: whatsappAccountId,
				tx
			});
		}
	}
	return jidIdentity;
}

export async function createWhatsappIdentity({
	personId,
	organizationId,
	whatsappAccountId,
	jid,
	tx
}: {
	personId: string;
	organizationId: string;
	whatsappAccountId: string;
	jid: string;
	tx: ServerTransaction;
}) {
	//create identity...
	return await upsertWhatsappIdentityForPersonUnsafe({
		personId,
		organizationId,
		whatsappAccountId,
		jid,
		tx
	});
}

export async function createWhatsappIdentityFromPhoneNumber({
	personId,
	organizationId,
	accountId,
	tx
}: {
	personId: string;
	organizationId: string;
	accountId: string;
	tx: ServerTransaction;
}) {
	//create identity from phone number...
	const person = await _getPersonByIdUnsafe({
		personId,
		organizationId,
		tx
	});
	if (!person.phoneNumber) {
		throw new Error('Person has no phone number');
	}
	const jid = await getJidFromPhoneNumber({ phoneNumber: person.phoneNumber });
	if (!jid) {
		throw new Error('JID not found');
	}
	const identity = await createWhatsappIdentity({
		personId,
		organizationId,
		whatsappAccountId: accountId,
		jid,
		tx
	});
	return identity;
}

export async function sendWhatsappMessage({
	message,
	personId,
	sendingUserId,
	threadId,
	nodeId,
	messageId,
	whatsappAccountId,
	organizationId,
	timeoutMs
}: {
	message: WhatsappMessage;
	organizationId: string;
	whatsappAccountId: string;
	threadId?: string;
	nodeId?: string;
	messageId?: string;
	personId: string;
	sendingUserId?: string;
	timeoutMs?: number;
}) {
	if (timeoutMs) {
		await sleep(timeoutMs);
	}
	const whatsappMessageId = messageId || uuidv7();
	await db.transaction(async (tx) => {
		const organization = await getOrganizationByIdUnsafe({
			organizationId,
			tx
		});
		const whatsappMessage = message;
		const personObject = await _getPersonByIdUnsafe({
			personId: personId,
			organizationId: organizationId,
			tx
		});
		if (!personObject) {
			throw new Error('Person not found');
		}
		const recipient = await resolveWhatsappIdentity({
			personId: personObject.id,
			organizationId: organization.id,
			whatsappAccountId,
			tx
		});
		const titanMessage = convertOutboundMessage({ message: whatsappMessage });
		const titanResponse = await sendWhatsappMessageToTitan({ message: titanMessage });
		if (!titanResponse.id) {
			throw new Error('Failed to send message to Titan');
		}
		const messageToInsert: typeof whatsappMessageTable.$inferInsert = {
			id: whatsappMessageId,
			organizationId: organization.id,
			personId: personId,
			userId: sendingUserId,
			type: 'outgoing_api_message',
			message: whatsappMessage,
			externalId: titanResponse.id,
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

async function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}
