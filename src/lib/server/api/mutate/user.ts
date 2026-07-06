import { defineMutator } from '@rocicorp/zero';
import { updateUserSettingsMutatorSchemaZero } from '$lib/schema/user';
import * as dataFunctions from '$lib/server/api/data/user/user';

export const updateUserSettings = defineMutator(
	updateUserSettingsMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateUserSettings can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('updateUserSettings can only be called by a user');
		}
		await dataFunctions.updateUserSettings({ tx, ctx: { ...ctx, userId: ctx.userId }, args });
	}
);
