import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import {
	type UpdateOrganizationZeroMutatorSchema,
	updateOrganizationZeroMutatorSchema,
	type UpdateOrganizationWhatsappSettings
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

export function updateOrganizationWhatsappSettings() {
	return async function (
		tx: Transaction<Schema>,
		args: { metadata: { organizationId: string }; input: UpdateOrganizationWhatsappSettings }
	) {
		const currentOrg = await tx.query.organization
			.where('id', '=', args.metadata.organizationId)
			.one()
			.run();

		if (!currentOrg) {
			throw new Error('Organization not found');
		}

		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			settings: {
				...currentOrg.settings,
				whatsApp: {
					...currentOrg.settings?.whatsApp,
					...args.input
				}
			},
			updatedAt: new Date().getTime()
		});
	};
}
