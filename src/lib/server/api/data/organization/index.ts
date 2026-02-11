import { organization, member } from '$lib/schema/drizzle';
import { drizzle } from '$lib/server/db';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq } from 'drizzle-orm';
import { type QueryContext, builder } from '$lib/zero/schema';
import {
	updateOrganizationZeroMutatorSchema,
	updateOrganizationWhatsappSettingsMutatorSchema,
	type UpdateOrganizationMutatorSchema,
	type UpdateOrganizationWhatsappSettingsMutatorSchema
} from '$lib/schema/organization';

import {
	type UpdateThemeZeroMutatorSchema,
	updateThemeZeroMutatorSchema
} from '$lib/schema/organization/settings';

import { parse } from 'valibot';
export async function updateOrganization({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateOrganizationMutatorSchema;
}) {
	const parsed = parse(updateOrganizationZeroMutatorSchema, args);
	const organizationId = parsed.metadata.organizationId;

	const currentOrg = await getOrganizationByIdForAdminOrOwner({ tx, ctx, organizationId });
	const [updated] = await tx.dbTransaction.wrappedTransaction
		.update(organization)
		.set({
			...parsed.input,
			updatedAt: new Date()
		})
		.where(eq(organization.id, organizationId))
		.returning();

	if (!updated) {
		throw new Error('Failed to update organization');
	}

	return updated;
}

export async function updateOrganizationWhatsappSettings({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateOrganizationWhatsappSettingsMutatorSchema;
}) {
	const parsed = parse(updateOrganizationWhatsappSettingsMutatorSchema, args);
	const organizationId = parsed.metadata.organizationId;

	const currentOrg = await getOrganizationByIdForAdminOrOwner({ tx, ctx, organizationId });
	const updatedSettings = {
		...currentOrg.settings,
		whatsApp: {
			...currentOrg.settings?.whatsApp,
			...parsed.input
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
	return updated;
}

export async function updateTheme({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateThemeZeroMutatorSchema;
}) {
	const parsed = parse(updateThemeZeroMutatorSchema, args);

	const orgRecord = await getOrganizationByIdForAdminOrOwner({
		tx,
		ctx,
		organizationId: parsed.metadata.organizationId
	});

	const [updated] = await tx.dbTransaction.wrappedTransaction
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
		.where(eq(organization.id, parsed.metadata.organizationId))
		.returning();

	if (!updated) {
		throw new Error('Failed to update theme');
	}
	return updated;
}

export async function _listOrganizationMembershipsByUserIdUnsafe({
	userId
}: {
	userId: string;
}): Promise<(typeof member.$inferSelect)[]> {
	const result = await drizzle.query.member.findMany({
		where: eq(member.userId, userId)
	});
	return result;
}

export async function getOrganization({
	userId,
	organizationId
}: {
	userId: string;
	organizationId: string;
}): Promise<typeof organization.$inferSelect> {
	const result = await drizzle.query.organization.findFirst({
		with: {
			memberships: {
				where: eq(member.userId, userId)
			}
		},
		where: eq(organization.id, organizationId)
	});
	if (!result) {
		throw new Error('Organization not found');
	}
	if (!result.memberships.some((m) => m.userId === userId)) {
		throw new Error('You are not a member of this organization');
	}
	return result;
}

export async function getOrganizationByIdUnsafe({
	organizationId,
	tx
}: {
	organizationId: string;
	tx: ServerTransaction;
}): Promise<typeof organization.$inferSelect> {
	const [result] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(organization)
		.where(eq(organization.id, organizationId));
	if (!result) {
		throw new Error('Organization not found');
	}
	return result;
}

export async function _getOrganizationIdBySlugUnsafe({
	organizationSlug
}: {
	organizationSlug: string;
}): Promise<string> {
	const result = await drizzle.query.organization.findFirst({
		where: eq(organization.slug, organizationSlug)
	});
	if (!result) {
		throw new Error('Organization not found');
	}
	return result.id;
}

export async function getOrganizationByIdForAdminOrOwner({
	tx,
	organizationId,
	ctx
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	organizationId: string;
}): Promise<typeof organization.$inferSelect> {
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(organizationId)) {
		throw new Error('You are not authorized to get this organization');
	}
	const result = await tx.dbTransaction.wrappedTransaction.query.organization.findFirst({
		where: eq(organization.id, organizationId)
	});
	if (!result) {
		throw new Error('Organization not found');
	}
	return result;
}
