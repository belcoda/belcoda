import { defineMutator } from '@rocicorp/zero';
import {
	emojiReactionMutatorSchemaZero as emojiReactionMutatorSchema,
	isReactionSupportedMessageType,
	createWhatsAppMessageMutatorSchema
} from '$lib/schema/whatsapp-message';
import { env as publicEnv } from '$env/dynamic/public';
export const emojiReaction = defineMutator(
	emojiReactionMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (!isReactionSupportedMessageType(args.whatsappMessage.type)) {
			throw new Error('Activity is not an incoming or outgoing whatsapp API message');
		}

		if (!args.whatsappMessage.wamidId) {
			throw new Error('No wamid ID');
		}

		const emojiReactionArray = structuredClone(args.whatsappMessage.message.emojiReactions || []);

		//check if there is already a reaction via Belcoda
		const existingReactionIndex = emojiReactionArray?.findIndex((reaction) => reaction.viaBelcoda);
		if (existingReactionIndex !== -1) {
			if (args.emoji) {
				emojiReactionArray[existingReactionIndex].emoji = args.emoji || null;
				emojiReactionArray[existingReactionIndex].reactedAt = new Date().getTime();
			} else {
				emojiReactionArray.splice(existingReactionIndex, 1);
			}
		} else {
			if (args.emoji) {
				//only add the reaction if it is not null
				emojiReactionArray.push({
					emoji: args.emoji || null,
					personId: args.personId,
					phoneNumber: publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER,
					viaBelcoda: true,
					reactedAt: new Date().getTime()
				});
			}
		}

		const message = {
			...args.whatsappMessage.message,
			emojiReactions: emojiReactionArray
		};
		await tx.mutate.whatsappMessage.update({
			id: args.whatsappMessage.id,
			message: message,
			updatedAt: Date.now()
		});
	}
);

export const sendIndividualMessage = defineMutator(
	createWhatsAppMessageMutatorSchema,
	async ({ tx, args, ctx }) => {
		console.log('sendIndividualMessage', args);
		tx.mutate.whatsappMessage.insert({
			id: args.metadata.whatsappMessageId,
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			message: args.input.whatsappMessage,
			type: 'outgoing_api_message',
			status: 'pending',
			userId: args.metadata.sentByUserId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			deliveredAt: null,
			readAt: null
		});
		//if we have an activity id, we should create the activity immediately...
		if (args.metadata.activityId) {
			tx.mutate.activity.insert({
				id: args.metadata.activityId,
				organizationId: args.metadata.organizationId,
				personId: args.metadata.personId,
				userId: args.metadata.sentByUserId,
				type: 'whatsapp_message_outgoing',
				referenceId: args.metadata.whatsappMessageId,
				unread: true,
				createdAt: Date.now()
			});
		}
	}
);
