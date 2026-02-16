import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import { defineMutator } from '@rocicorp/zero';

import {
	type CreateMutatorSchemaOutput,
	type UpdateMutatorSchemaOutput,
	type SendMutatorSchemaOutput,
	deleteMutatorSchema,
	createMutatorSchema,
	updateMutatorSchema,
	sendMutatorSchema
} from '$lib/schema/email-message';
import { parse } from 'valibot';

export const createEmailMessage = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
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
});

export const updateEmailMessage = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.emailMessage.update({
		id: args.metadata.emailMessageId,
		...args.input,
		updatedAt: new Date().getTime()
	});
});

export const deleteEmailMessage = defineMutator(deleteMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.emailMessage.update({
		id: args.id,
		organizationId: args.organizationId,
		deletedAt: new Date().getTime()
	});
});

export const sendEmailMessage = defineMutator(sendMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.emailMessage.update({
		id: args.metadata.emailMessageId,
		subject: args.input.subject ?? undefined,
		body: args.input.body ?? undefined,
		startedAt: new Date().getTime(),
		updatedAt: new Date().getTime()
	});
});
