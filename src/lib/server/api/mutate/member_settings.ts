import { defineMutator } from '@rocicorp/zero';

import { updatePeopleSidebarSettingsZeroMutatorSchema } from '$lib/schema/member/settings';
import { updatePeopleSidebarSettings as updatePeopleSidebarSettingsData } from '$lib/server/api/data/organization/member';

export const updatePeopleSidebarSettings = defineMutator(
	updatePeopleSidebarSettingsZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updatePeopleSidebarSettings can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('updatePeopleSidebarSettings can only be called by a user');
		}
		await updatePeopleSidebarSettingsData({
			tx,
			ctx: { ...ctx, userId: ctx.userId },
			args
		});
	}
);
