import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { randomBytes } from 'crypto';

import {
	type CreateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero
} from '$lib/schema/webhook';
import { webhook, organization } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { webhookReadPermissions } from '$lib/zero/query/webhook/permissions';

export function createWebhook(params: MutatorParams) {
	return async function (tx: Transaction, input: CreateMutatorSchemaZeroOutput) {
		// Verify organization exists
		const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, input.metadata.organizationId))
			.limit(1);
		if (!organizationRecord) {
			throw new Error('Organization not found');
		}

		// Only owners can create webhooks
		if (!params.queryContext.ownerOrgs.includes(organizationRecord.id)) {
			throw new Error(
				'You are not authorized to create webhooks. Only owners can create webhooks.'
			);
		}

		// Check if webhook name already exists for this organization
		const [existingWebhook] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(webhook)
			.where(
				and(
					eq(webhook.name, input.input.name),
					eq(webhook.organizationId, input.metadata.organizationId)
				)
			)
			.limit(1);
		if (existingWebhook) {
			throw new Error('A webhook with this name already exists for this organization');
		}

		// Generate secret if not provided
		const secret = input.input.secret || randomBytes(32).toString('hex');

		const webhookToCreate: typeof webhook.$inferInsert = {
			id: input.metadata.webhookId,
			organizationId: input.metadata.organizationId,
			name: input.input.name,
			targetUrl: input.input.targetUrl,
			secret: secret,
			verificationMode: 'api_key',
			enabled: true,
			eventTypes: input.input.eventTypes,
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

		params.result?.push(result);
	};
}

export function deleteWebhook(params: MutatorParams) {
	return async function (tx: Transaction, input: DeleteMutatorSchemaZero) {
		const [webhookRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(webhook)
			.where(eq(webhook.id, input.metadata.webhookId))
			.limit(1);
		if (!webhookRecord) {
			throw new Error('Webhook not found');
		}

		if (
			!params.queryContext.adminOrgs.includes(webhookRecord.organizationId) &&
			!params.queryContext.ownerOrgs.includes(webhookRecord.organizationId)
		) {
			throw new Error('You are not authorized to delete this webhook');
		}

		if (webhookRecord.organizationId !== input.metadata.organizationId) {
			throw new Error('Webhook does not belong to the specified organization');
		}

		await tx.dbTransaction.wrappedTransaction
			.delete(webhook)
			.where(eq(webhook.id, input.metadata.webhookId));
	};
}
