import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { webhook } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

import {
	type CreateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero,
	createMutatorSchemaZero,
	deleteMutatorSchemaZero
} from '$lib/schema/webhook';

import { getOrganizationByIdForAdminOrOwner } from '$lib/server/api/data/organization';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { drizzle } from '$lib/server/db';
import { parse } from 'valibot';

/**
 * Returns the full webhook row (including secret) if the user is an organization owner
 * for that webhook's organization. Otherwise returns null (including when the webhook
 * id does not exist) so callers can respond with 404 without leaking membership.
 */
export async function getWebhookSecretByIdForOwner({
	userId,
	webhookId
}: {
	userId: string;
	webhookId: string;
}): Promise<string> {
	const ctx = await getQueryContext(userId);
	const row = await drizzle.query.webhook.findFirst({
		where: eq(webhook.id, webhookId)
	});
	if (!row) {
		throw new Error('Webhook not found');
	}
	if (!ctx.ownerOrgs.includes(row.organizationId)) {
		throw new Error('You are not authorized to get the secret for this webhook');
	}
	return row.secret;
}

export async function createWebhook({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchemaZeroOutput;
}) {
	const parsed = parse(createMutatorSchemaZero, args);
	const organizationRecord = await getOrganizationByIdForAdminOrOwner({
		tx,
		ctx,
		organizationId: parsed.metadata.organizationId
	});
	if (!organizationRecord) {
		throw new Error('Organization not found');
	}
	// only owners can create webhooks
	if (!ctx.ownerOrgs.includes(organizationRecord.id)) {
		throw new Error('You are not authorized to create a webhook in this organization');
	}

	// check if webhook name already exists for this organization
	const [existingWebhook] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(webhook)
		.where(
			and(
				eq(webhook.name, parsed.input.name),
				eq(webhook.organizationId, parsed.metadata.organizationId)
			)
		)
		.limit(1);
	if (existingWebhook) {
		throw new Error('A webhook with this name already exists for this organization');
	}

	// generate secret if not provided
	const secret = parsed.input.secret || randomBytes(32).toString('hex');

	const webhookToCreate: typeof webhook.$inferInsert = {
		id: parsed.metadata.webhookId,
		organizationId: parsed.metadata.organizationId,
		name: parsed.input.name,
		targetUrl: parsed.input.targetUrl,
		secret: secret,
		verificationMode: 'api_key',
		enabled: true,
		eventTypes: parsed.input.eventTypes,
		createdAt: new Date(),
		updatedAt: new Date(),
		lastSuccessAt: null,
		lastFailureAt: null
	};
	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(webhook)
		.values(webhookToCreate)
		.returning();
	if (!result) {
		throw new Error('Unable to create webhook');
	}

	return result;
}

export async function deleteWebhook({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteMutatorSchemaZero;
}) {
	const parsed = parse(deleteMutatorSchemaZero, args);
	const [webhookRecord] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(webhook)
		.where(eq(webhook.id, parsed.metadata.webhookId))
		.limit(1);
	if (!webhookRecord) {
		throw new Error('Webhook not found');
	}

	// only owners can delete webhooks
	if (!ctx.ownerOrgs.includes(webhookRecord.organizationId)) {
		throw new Error('You are not authorized to delete this webhook');
	}

	if (webhookRecord.organizationId !== parsed.metadata.organizationId) {
		throw new Error('Webhook does not belong to the specified organization');
	}

	await tx.dbTransaction.wrappedTransaction
		.delete(webhook)
		.where(eq(webhook.id, parsed.metadata.webhookId));
}
