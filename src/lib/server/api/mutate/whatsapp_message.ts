import { emojiReactionMutatorSchemaZero as emojiReactionMutatorSchema } from '$lib/schema/whatsapp-message';
import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/whatsapp/message';

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
