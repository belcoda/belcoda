import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { webhook } from '$lib/schema/drizzle';
import { and, eq, ne } from 'drizzle-orm';
import { randomBytes } from 'crypto';

import {
	type CreateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero,
	type UpdateWebhookMutatorSchemaZeroOutput,
	createMutatorSchemaZero,
	deleteMutatorSchemaZero,
	updateWebhookMutatorSchemaZero
} from '$lib/schema/webhook';

import { getOrganizationByIdForAdminOrOwner } from '$lib/server/api/data/organization';
import { parse } from 'valibot';

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

export async function updateWebhook({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateWebhookMutatorSchemaZeroOutput;
}) {
	const parsed = parse(updateWebhookMutatorSchemaZero, args);
	const [webhookRecord] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(webhook)
		.where(eq(webhook.id, parsed.metadata.webhookId))
		.limit(1);
	if (!webhookRecord) {
		throw new Error('Webhook not found');
	}

	if (!ctx.ownerOrgs.includes(webhookRecord.organizationId)) {
		throw new Error('You are not authorized to update this webhook');
	}

	if (webhookRecord.organizationId !== parsed.metadata.organizationId) {
		throw new Error('Webhook does not belong to the specified organization');
	}

	if (parsed.input.name !== webhookRecord.name) {
		const [nameConflict] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(webhook)
			.where(
				and(
					eq(webhook.name, parsed.input.name),
					eq(webhook.organizationId, parsed.metadata.organizationId),
					ne(webhook.id, parsed.metadata.webhookId)
				)
			)
			.limit(1);
		if (nameConflict) {
			throw new Error('A webhook with this name already exists for this organization');
		}
	}

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(webhook)
		.set({
			name: parsed.input.name,
			targetUrl: parsed.input.targetUrl,
			updatedAt: new Date()
		})
		.where(eq(webhook.id, parsed.metadata.webhookId))
		.returning();
	if (!result) {
		throw new Error('Unable to update webhook');
	}
	return result;
}
