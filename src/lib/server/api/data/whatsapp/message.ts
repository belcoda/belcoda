import { whatsappMessage } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import type { ServerTransaction } from '@rocicorp/zero';

import pino from '$lib/pino';
const log = pino(import.meta.url);

import {
	type WhatsappMessage,
	whatsappMessage as whatsappMessageObjectSchema,
	type WhatsappMessageActivityType
} from '$lib/schema/whatsapp/message';
import { v7 as uuidv7 } from 'uuid';

import { parse } from 'valibot';
export async function _findWhatsAppMessageByWamidIdUnsafe({
	wamidId,
	tx
}: {
	wamidId: string;
	tx: ServerTransaction;
}) {
	const result = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(whatsappMessage)
		.where(and(eq(whatsappMessage.wamidId, wamidId)));
	if (result.length === 0) {
		throw new Error('WhatsApp message not found');
	}
	if (result.length > 1) {
		throw new Error('Multiple WhatsApp messages found for the same wamid id');
	}
	return result[0];
}

export async function _findWhatsAppMessageByIdUnsafe({
	messageId,
	tx
}: {
	messageId: string;
	tx: ServerTransaction;
}) {
	const result = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(whatsappMessage)
		.where(eq(whatsappMessage.id, messageId));
	if (result.length === 0) {
		throw new Error('WhatsApp message not found');
	}
	if (result.length > 1) {
		throw new Error('Multiple WhatsApp messages found for the same id');
	}
	return result[0];
}

export async function handleIncomingReaction({
	messageId,
	personId,
	phoneNumber,
	emoji,
	tx
}: {
	messageId: string;
	emoji: string | null;
	personId: string;
	phoneNumber: string;
	tx: ServerTransaction;
}) {
	const messageActivity = await _findWhatsAppMessageByIdUnsafe({ messageId, tx });
	if (['incoming_whatsapp_message', 'outgoing_whatsapp_message'].includes(messageActivity.type)) {
		if (messageActivity.wamidId) {
			// first find if the reactor (personId / phone number) is already in the emojiReactions array
			const reactions = structuredClone(messageActivity.message.emojiReactions || []);
			log.debug({ reactions, personId, phoneNumber }, 'Reactions');
			const existingReactorIndex = reactions.findIndex(
				(reaction) => reaction.personId === personId && reaction.phoneNumber === phoneNumber
			);
			const existingReactor = structuredClone(reactions[existingReactorIndex]);
			if (existingReactor) {
				if (emoji) {
					existingReactor.emoji = emoji;
					existingReactor.reactedAt = Date.now();
					reactions[existingReactorIndex] = existingReactor;
				} else {
					reactions.splice(existingReactorIndex, 1);
				}
			} else if (emoji) {
				reactions.push({
					emoji,
					personId,
					phoneNumber,
					viaBelcoda: false,
					reactedAt: Date.now()
				});
			}

			await tx.dbTransaction.wrappedTransaction
				.update(whatsappMessage)
				.set({
					message: {
						...messageActivity.message,
						emojiReactions: reactions
					}
				})
				.where(eq(whatsappMessage.id, messageActivity.id));
		}
	}
}

export async function createWhatsAppMessage({
	id,
	message,
	type,
	organizationId,
	personId,
	tx
}: {
	id: string;
	message: WhatsappMessage;
	organizationId: string;
	type: WhatsappMessageActivityType;
	personId: string;
	tx: ServerTransaction;
}) {
	const parsed = await parse(whatsappMessageObjectSchema, message);
	const insertedId = id || uuidv7();
	const toInsert: typeof whatsappMessage.$inferInsert = {
		id: insertedId,
		message: parsed,
		type,
		personId,
		status: 'pending',
		organizationId,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(whatsappMessage)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create WhatsApp message');
	}
	return result[0];
}
