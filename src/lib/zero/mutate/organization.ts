import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type UpdateOrganization,
	type UpdateOrganizationWhatsappSettings
} from '$lib/schema/organization';

export function updateOrganization() {
	return async function (
		tx: Transaction<Schema>,
		args: { metadata: { organizationId: string }; input: UpdateOrganization }
	) {
		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			...args.input,
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
