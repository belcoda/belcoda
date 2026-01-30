import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero
} from '$lib/schema/webhook';

export function createWebhook() {
	return async function (tx: Transaction<Schema>, args: CreateMutatorSchemaZeroOutput) {
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
	};
}

export function deleteWebhook() {
	return async function (tx: Transaction<Schema>, args: DeleteMutatorSchemaZero) {
		tx.mutate.webhook.delete({
			id: args.metadata.webhookId
		});
	};
}
