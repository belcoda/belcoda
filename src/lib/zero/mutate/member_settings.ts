import { defineMutator } from '@rocicorp/zero';

import { updatePeopleSidebarSettingsZeroMutatorSchema } from '$lib/schema/member/settings';

export const updatePeopleSidebarSettings = defineMutator(
	updatePeopleSidebarSettingsZeroMutatorSchema,
	async () => {}
);
