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
import {
	emojiReactionMutatorSchemaZero as emojiReactionMutatorSchema,
	type EmojiReactionMutatorSchemaZero as EmojiReactionMutatorSchema
} from '$lib/schema/whatsapp-message';
import { v7 as uuidv7 } from 'uuid';

import { parse } from 'valibot';

function isReactionSupportedMessageType(type: WhatsappMessageActivityType): boolean {
	return type === 'incoming_api_message' || type === 'outgoing_api_message';
}
import { structuredClone } from '$lib/utils/structuredClone';
import type { QueryContext } from '$lib/zero/schema';
import { getPerson } from '$lib/server/api/data/person/person';
import { getOrganizationByIdUnsafe } from '../organization';

import { env as publicEnv } from '$env/dynamic/public';
import { sendEmojiReaction } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';

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
	if (isReactionSupportedMessageType(messageActivity.type)) {
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

export async function emojiReaction({
	ctx,
	args: argsInput,
	tx
}: {
	args: EmojiReactionMutatorSchema;
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const args = parse(emojiReactionMutatorSchema, argsInput);

	const messageActivity = await _findWhatsAppMessageByIdUnsafe({
		messageId: args.whatsappMessage.id,
		tx
	});
	if (messageActivity.organizationId !== args.organizationId) {
		throw new Error('WhatsApp message does not belong to this organization');
	}
	if (!isReactionSupportedMessageType(messageActivity.type)) {
		throw new Error('Message activity type not supported');
	}
	if (messageActivity.wamidId) {
		// first find if the reactor (personId / phone number) is already in the emojiReactions array
		const personRecord = await getPerson({
			tx,
			ctx,
			args: { organizationId: args.organizationId, personId: args.personId }
		});
		const to = personRecord.whatsAppUsername?.trim() || personRecord.phoneNumber?.trim() || '';
		if (!to) {
			throw new Error('Person WhatsApp username or phone number required for reaction');
		}

		//get organization record
		const organizationRecord = await getOrganizationByIdUnsafe({
			organizationId: args.organizationId,
			tx
		});
		const from =
			organizationRecord.settings.whatsApp.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER;
		const reaction = args.emoji || '';
		const wamid = messageActivity.wamidId;

		await sendEmojiReaction({
			messageWamid: wamid,
			emoji: reaction,
			from,
			to
		});

		const emojiReactionArray = structuredClone(messageActivity.message.emojiReactions || []);
		const existingReactionIndex = emojiReactionArray?.findIndex((reaction) => reaction.viaBelcoda);
		if (existingReactionIndex !== -1) {
			if (reaction) {
				emojiReactionArray[existingReactionIndex].emoji = reaction || null;
				emojiReactionArray[existingReactionIndex].reactedAt = new Date().getTime();
			} else {
				emojiReactionArray.splice(existingReactionIndex, 1);
			}
		} else {
			if (reaction) {
				//only add the reaction if it is not null
				emojiReactionArray.push({
					emoji: reaction || null,
					personId: args.personId,
					phoneNumber: from,
					viaBelcoda: true,
					reactedAt: new Date().getTime()
				});
			}
		}

		await tx.dbTransaction.wrappedTransaction
			.update(whatsappMessage)
			.set({
				message: { ...messageActivity.message, emojiReactions: emojiReactionArray }
			})
			.where(eq(whatsappMessage.id, messageActivity.id));
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
