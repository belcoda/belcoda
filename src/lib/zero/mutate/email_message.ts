import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreateMutatorSchemaOutput,
	type UpdateMutatorSchemaOutput,
	type SendMutatorSchemaOutput,
	createMutatorSchema,
	updateMutatorSchema,
	sendMutatorSchema
} from '$lib/schema/email-message';
import { parse } from 'valibot';

export function createEmailMessage() {
	return async function (tx: Transaction<Schema>, args: CreateMutatorSchemaOutput) {
		const parsedArgs = parse(createMutatorSchema, args);
		tx.mutate.emailMessage.insert({
			id: parsedArgs.metadata.emailMessageId,
			organizationId: parsedArgs.metadata.organizationId,
			teamId: null,
			emailFromSignatureId: parsedArgs.input.emailFromSignatureId,
			replyToOverride: parsedArgs.input.replyToOverride ?? null,
			recipients: parsedArgs.input.recipients,
			previewTextOverride: parsedArgs.input.previewTextOverride ?? null,
			previewTextLock: parsedArgs.input.previewTextLock ?? false,
			subject: parsedArgs.input.subject ?? null,
			body: parsedArgs.input.body ?? null,
			sentBy: null,
			startedAt: null,
			completedAt: null,
			estimatedRecipientCount: 0,
			successfulRecipientCount: 0,
			failedRecipientCount: 0,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime(),
			deletedAt: null
		});
	};
}

export function updateEmailMessage() {
	return async function (tx: Transaction<Schema>, args: UpdateMutatorSchemaOutput) {
		const parsed = parse(updateMutatorSchema, args);
		tx.mutate.emailMessage.update({
			id: parsed.metadata.emailMessageId,
			...parsed.input,
			updatedAt: new Date().getTime()
		});
	};
}

export function deleteEmailMessage() {
	return async function (tx: Transaction<Schema>, args: { id: string; organizationId: string }) {
		tx.mutate.emailMessage.update({
			id: args.id,
			deletedAt: new Date().getTime()
		});
	};
}

export function sendEmailMessage() {
	return async function (tx: Transaction<Schema>, args: SendMutatorSchemaOutput) {
		const parsed = parse(sendMutatorSchema, args);
		tx.mutate.emailMessage.update({
			id: parsed.metadata.emailMessageId,
			subject: parsed.input.subject ?? undefined,
			body: parsed.input.body ?? undefined,
			startedAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	};
}
