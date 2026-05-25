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
	type EmojiReactionMutatorSchemaZero as EmojiReactionMutatorSchema,
	isReactionSupportedMessageType,
	whatsappMessageApiSchema,
	type CreateWhatsAppMessageMutatorSchema,
	createWhatsAppMessageMutatorSchema
} from '$lib/schema/whatsapp-message';
import { v7 as uuidv7 } from 'uuid';

import { parse } from 'valibot';
import { structuredClone } from '$lib/utils/structuredClone';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
import type { QueryContext } from '$lib/zero/schema';
import { getPerson } from '$lib/server/api/data/person/person';
import { getOrganizationByIdUnsafe } from '../organization';

import { env as publicEnv } from '$env/dynamic/public';
import { sendEmojiReaction } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { extractExternalId } from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
import { drizzle } from '$lib/server/db';
import { sendWhatsappMessage } from '$lib/server/utils/whatsapp/send_message';

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

/**
 * Resolves a `whatsapp_message` row from a YCloud `whatsapp.message.updated` payload.
 *
 * YCloud and our schema both use the name "externalId" for different things:
 *
 * - **YCloud `whatsappMessage.id`** (e.g. `6a06cffd21183230f75efb3c`): YCloud's message resource id,
 *   returned from `sendWhatsappMessageToYCloud()` and stored in our `whatsapp_message.external_id`
 *   (see `send_message.ts`).
 *
 * - **YCloud `whatsappMessage.externalId`** (e.g. `threadId:nodeId:messageId`): Belcoda composite we
 *   attach when sending via `createExternalId()` — `[whatsapp_thread.id]:[flow_node.id]:[whatsapp_message.id]`.
 *
 * Lookup order:
 * 1. `ycloudMessageId` → `whatsapp_message.external_id`
 * 2. If not found, parse `belcodaCompositeExternalId` and match `whatsapp_message.id` (third segment)
 */
export async function _findWhatsAppMessageForYCloudStatusUpdate({
	ycloudMessageId,
	belcodaCompositeExternalId
}: {
	ycloudMessageId: string;
	belcodaCompositeExternalId?: string;
}) {
	const byYcloudId = await drizzle
		.select()
		.from(whatsappMessage)
		.where(eq(whatsappMessage.externalId, ycloudMessageId));

	if (byYcloudId.length === 1) {
		return byYcloudId[0];
	}
	if (byYcloudId.length > 1) {
		throw new Error('Multiple WhatsApp messages found for the same YCloud message id');
	}

	if (belcodaCompositeExternalId) {
		const { whatsappMessageId } = extractExternalId(belcodaCompositeExternalId);
		if (whatsappMessageId !== 'UNKNOWN') {
			const byPrimaryKey = await drizzle
				.select()
				.from(whatsappMessage)
				.where(eq(whatsappMessage.id, whatsappMessageId));
			if (byPrimaryKey.length === 1) {
				return byPrimaryKey[0];
			}
			if (byPrimaryKey.length > 1) {
				throw new Error('Multiple WhatsApp messages found for the same id');
			}
		}
	}

	throw new Error('WhatsApp message not found');
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

			const [updatedMsg] = await tx.dbTransaction.wrappedTransaction
				.update(whatsappMessage)
				.set({
					updatedAt: new Date(),
					message: {
						...messageActivity.message,
						emojiReactions: reactions
					}
				})
				.where(eq(whatsappMessage.id, messageActivity.id))
				.returning();
			if (updatedMsg) {
				const { organizationId, externalId: _externalId, ...rest } = updatedMsg;
				const q = await getQueue();
				await q.triggerWebhook(
					{
						organizationId,
						payload: {
							type: 'whatsapp.message.updated',
							data: parse(whatsappMessageApiSchema, rest)
						}
					},
					queueSendOptionsFromTransaction(tx)
				);
			}
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

	// get the message record from the database rather than relying on the possibly forged user-provided one
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
				updatedAt: new Date(),
				message: { ...messageActivity.message, emojiReactions: emojiReactionArray }
			})
			.where(eq(whatsappMessage.id, messageActivity.id));
		try {
			await sendEmojiReaction({
				messageWamid: wamid,
				emoji: reaction,
				from,
				to
			});
		} catch (error) {
			log.error(
				{ error, messageActivity, reaction, wamid, from, to },
				'Failed to send emoji reaction'
			);
			throw error; //in the future, maybe we'd look at reversing the database update...
		}
	} else {
		throw new Error('Message does not have a wamid ID, which is required for reactions');
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
	const created = result[0];
	const { organizationId: orgId, externalId: _externalId, ...rest } = created;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId: orgId,
			payload: {
				type: 'whatsapp.message.created',
				data: parse(whatsappMessageApiSchema, rest)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return created;
}

export async function sendIndividualMessage({
	ctx,
	args: argsInput
}: {
	args: CreateWhatsAppMessageMutatorSchema;
	ctx: QueryContext;
}) {
	const args = parse(createWhatsAppMessageMutatorSchema, argsInput);
	if (
		ctx.adminOrgs.includes(args.metadata.organizationId) ||
		ctx.ownerOrgs.includes(args.metadata.organizationId)
	) {
		await sendWhatsappMessage({
			message: args.input.whatsappMessage,
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			sendingUserId: ctx.userId || args.metadata.sentByUserId || undefined,
			messageId: args.metadata.whatsappMessageId
		});
	} else {
		throw new Error('You are not authorized to send a WhatsApp message in this organization');
	}
}
