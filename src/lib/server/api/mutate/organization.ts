import { parse } from 'valibot';
import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { organization } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import {
	type UpdateOrganizationZeroMutatorSchema,
	updateOrganizationZeroMutatorSchema
} from '$lib/schema/organization';
import {
	type UpdateThemeZeroMutatorSchema,
	updateThemeZeroMutatorSchema
} from '$lib/schema/organization/settings';

export function updateOrganization(params: MutatorParams) {
	return async function (tx: Transaction, input: UpdateOrganizationZeroMutatorSchema) {
		const parsed = parse(updateOrganizationZeroMutatorSchema, input);

		const isAdminOrOwner =
			params.queryContext.adminOrgs.includes(parsed.metadata.organizationId) ||
			params.queryContext.ownerOrgs.includes(parsed.metadata.organizationId);

		if (!isAdminOrOwner) {
			throw new Error('You must be an admin or owner to update organization');
		}

		await tx.dbTransaction.wrappedTransaction
			.update(organization)
			.set({
				...parsed.input,
				updatedAt: new Date()
			})
			.where(eq(organization.id, parsed.metadata.organizationId));
	};
}

export function updateTheme(params: MutatorParams) {
	return async function (tx: Transaction, input: UpdateThemeZeroMutatorSchema) {
		const parsed = parse(updateThemeZeroMutatorSchema, input);

		const isAdminOrOwner =
			params.queryContext.adminOrgs.includes(parsed.metadata.organizationId) ||
			params.queryContext.ownerOrgs.includes(parsed.metadata.organizationId);

		if (!isAdminOrOwner) {
			throw new Error('You must be an admin or owner to update organization theme');
		}

		const orgRecord = await tx.query.organization
			.where('id', '=', parsed.metadata.organizationId)
			.one()
			.run();

		if (!orgRecord) {
			throw new Error('Organization not found');
		}

		await tx.dbTransaction.wrappedTransaction
			.update(organization)
			.set({
				settings: {
					...orgRecord.settings,
					theme: {
						...orgRecord.settings.theme,
						...parsed.input
					}
				},
				updatedAt: new Date()
			})
			.where(eq(organization.id, parsed.metadata.organizationId));
	};
}
