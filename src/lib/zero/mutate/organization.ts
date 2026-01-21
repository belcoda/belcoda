import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import {
	type UpdateOrganizationZeroMutatorSchema,
	updateOrganizationZeroMutatorSchema
} from '$lib/schema/organization';
import {
	type UpdateThemeZeroMutatorSchema,
	updateThemeZeroMutatorSchema
} from '$lib/schema/organization/settings';
import { parse } from 'valibot';

export function updateOrganization() {
	return async function (tx: Transaction<Schema>, args: UpdateOrganizationZeroMutatorSchema) {
		const parsed = parse(updateOrganizationZeroMutatorSchema, args);
		tx.mutate.organization.update({
			id: parsed.metadata.organizationId,
			...parsed.input,
			updatedAt: new Date().getTime()
		});
	};
}

export function updateTheme() {
	return async function (tx: Transaction<Schema>, args: UpdateThemeZeroMutatorSchema) {
		const parsed = parse(updateThemeZeroMutatorSchema, args);
		const org = await tx.query.organization.where('id', parsed.metadata.organizationId).one().run();
		if (!org) {
			throw new Error('Organization not found');
		}

		tx.mutate.organization.update({
			id: parsed.metadata.organizationId,
			settings: {
				...org.settings,
				theme: {
					...org.settings.theme,
					...parsed.input
				}
			},
			updatedAt: new Date().getTime()
		});
	};
}
