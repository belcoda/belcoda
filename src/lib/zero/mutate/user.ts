import { defineMutator } from '@rocicorp/zero';
import { updateUserSettingsMutatorSchemaZero } from '$lib/schema/user';

export const updateUserSettings = defineMutator(
	updateUserSettingsMutatorSchemaZero,
	async () => {}
);
