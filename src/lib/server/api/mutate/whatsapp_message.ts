import {
	emojiReactionMutatorSchemaZero as emojiReactionMutatorSchema,
	createWhatsAppMessageMutatorSchema
} from '$lib/schema/whatsapp-message';
import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/whatsapp/message';
import {} from '$lib/schema/whatsapp-message';

export const emojiReaction = defineMutator(
	emojiReactionMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('emojiReaction can only be called from the server');
		}
		await dataFunctions.emojiReaction({
			tx,
			ctx,
			args: args
		});
	}
);

export const sendIndividualMessage = defineMutator(
	createWhatsAppMessageMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('sendIndividualMessage can only be called from the server');
		}
		await dataFunctions.sendIndividualMessage({
			tx,
			ctx,
			args: args
		});
	}
);
