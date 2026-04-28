import { defineMutator } from '@rocicorp/zero';
import {
	createMutatorSchemaZero,
	deleteMutatorSchemaZero,
	updateWebhookMutatorSchemaZero
} from '$lib/schema/webhook';
import { parse } from 'valibot';

export const createWebhook = defineMutator(createMutatorSchemaZero, async ({ tx, args }) => {
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

export const deleteWebhook = defineMutator(deleteMutatorSchemaZero, async ({ tx, args }) => {
	tx.mutate.webhook.delete({
		id: args.metadata.webhookId
	});
});

export const updateWebhook = defineMutator(updateWebhookMutatorSchemaZero, async ({ tx, args }) => {
	const parsed = parse(updateWebhookMutatorSchemaZero, args);
	tx.mutate.webhook.update({
		id: parsed.metadata.webhookId,
		name: parsed.input.name,
		targetUrl: parsed.input.targetUrl,
		updatedAt: Date.now()
	});
});
