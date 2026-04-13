import { defineMutator } from '@rocicorp/zero';
import { emojiReactionMutatorSchema } from '$lib/schema/whatsapp-message';
import { env as publicEnv } from '$env/dynamic/public';
export const emojiReaction = defineMutator(
	emojiReactionMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (!['incoming_api_message', 'outgoing_api_message'].includes(args.whatsappMessage.type)) {
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
