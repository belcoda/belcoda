import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';
import { createMutatorSchemaZero, deleteMutatorSchemaZero } from '$lib/schema/webhook';

export const createWebhook = defineMutator(createMutatorSchemaZero, async ({ tx, args, ctx }) => {
	const now = Date.now();
	tx.mutate.webhook.insert({
		id: args.metadata.webhookId,
		organizationId: args.metadata.organizationId,
		name: args.input.name,
		targetUrl: args.input.targetUrl,
		verificationMode: 'api_key',
		enabled: true,
		eventTypes: args.input.eventTypes,
		createdAt: now,
		updatedAt: now,
		lastSuccessAt: null,
		lastFailureAt: null
	});
});

export const deleteWebhook = defineMutator(deleteMutatorSchemaZero, async ({ tx, args, ctx }) => {
	tx.mutate.webhook.delete({
		id: args.metadata.webhookId
	});
});
