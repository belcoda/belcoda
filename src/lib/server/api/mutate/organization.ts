import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
import {
	type UpdateOrganization,
	type UpdateOrganizationWhatsappSettings
} from '$lib/schema/organization';
import {
	type UpdateThemeZeroMutatorSchema,
	updateThemeZeroMutatorSchema
} from '$lib/schema/organization/settings';
import { organization } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { parse } from 'valibot';

export function updateOrganization(params: MutatorParams) {
	return async function (
		tx: Transaction,
		input: { metadata: { organizationId: string }; input: UpdateOrganization }
	) {
		const organizationId = input.metadata.organizationId;

		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(organizationId)
		) {
			throw new Error('You are not authorized to update this organization');
		}

		const [updated] = await tx.dbTransaction.wrappedTransaction
			.update(organization)
			.set({
				...input.input,
				updatedAt: new Date()
			})
			.where(eq(organization.id, organizationId))
			.returning();

		if (!updated) {
			throw new Error('Failed to update organization');
		}

		params.result?.push(updated);
	};
}

export function updateOrganizationWhatsappSettings(params: MutatorParams) {
	return async function (
		tx: Transaction,
		input: { metadata: { organizationId: string }; input: UpdateOrganizationWhatsappSettings }
	) {
		const organizationId = input.metadata.organizationId;

		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(organizationId)
		) {
			throw new Error('You are not authorized to update this organization');
		}

		const currentOrg = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, organizationId))
			.limit(1)
			.then((rows) => rows[0]);

		if (!currentOrg) {
			throw new Error('Organization not found');
		}

		const updatedSettings = {
			...currentOrg.settings,
			whatsApp: {
				...currentOrg.settings?.whatsApp,
				...input.input
			}
		};

		const [updated] = await tx.dbTransaction.wrappedTransaction
			.update(organization)
			.set({
				settings: updatedSettings,
				updatedAt: new Date()
			})
			.where(eq(organization.id, organizationId))
			.returning();

		if (!updated) {
			throw new Error('Failed to update organization whatsapp settings');
		}

		params.result?.push(updated);
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
