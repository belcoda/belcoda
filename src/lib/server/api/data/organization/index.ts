import { organization, member } from '$lib/schema/drizzle';
import { drizzle } from '$lib/server/db';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq } from 'drizzle-orm';
import { type QueryContext, builder } from '$lib/zero/schema';
import {
	updateOrganizationZeroMutatorSchema,
	updateOrganizationWhatsappSettingsMutatorSchema,
	type UpdateOrganizationMutatorSchema,
	type UpdateOrganizationWhatsappSettingsMutatorSchema,
	organizationWebhook
} from '$lib/schema/organization';

import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';

import {
	type UpdateThemeZeroMutatorSchema,
	updateThemeZeroMutatorSchema
} from '$lib/schema/organization/settings';

import { parse } from 'valibot';
import { bindPhoneNumberToWaba } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';

import pino from '$lib/pino';
const log = pino(import.meta.url);

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

	const { id: _omitId, ...orgWebhookData } = updated;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId: updated.id,
			payload: {
				type: 'organization.updated',
				data: parse(organizationWebhook, orgWebhookData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);

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
	//number is actually a phone_number_id that needs to be exchanged for a phone number using ycloud api

	const updatedSettings = {
		...currentOrg.settings,
		whatsApp: {
			...currentOrg.settings?.whatsApp,
			...parsed.input
		}
	};
	const { number, wabaId } = parsed.input;
	if (number && wabaId) {
		const phoneNumber = await bindPhoneNumberToWabaWithBusinessCoexistenceOrNot({
			wabaId,
			phoneNumberId: number
		});
		updatedSettings.whatsApp.number = phoneNumber;
	}

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
	const { id: _omitId, ...orgWebhookData } = updated;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId: updated.id,
			payload: {
				type: 'organization.updated',
				data: parse(organizationWebhook, orgWebhookData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
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
	const { id: _omitId, ...orgWebhookData } = updated;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId: updated.id,
			payload: {
				type: 'organization.updated',
				data: parse(organizationWebhook, orgWebhookData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
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

async function bindPhoneNumberToWabaWithBusinessCoexistenceOrNot({
	wabaId,
	phoneNumberId
}: {
	wabaId: string;
	phoneNumberId: string;
}) {
	try {
		return await bindPhoneNumberToWaba({
			wabaId,
			phoneNumberId,
			businessCoexistence: false
		});
	} catch (error) {
		log.error(error, 'Error binding phone number to waba without business coexistence');
		try {
			return await bindPhoneNumberToWaba({
				wabaId,
				phoneNumberId,
				businessCoexistence: true
			});
		} catch (innerError) {
			log.error(innerError, 'Error binding phone number to waba with business coexistence');
			throw innerError;
		}
	}
}
