import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';

import {
	type CreateMutatorSchemaOutput,
	type UpdateMutatorSchemaOutput,
	createMutatorSchema,
	updateMutatorSchema
} from '$lib/schema/email-message';
import { parse } from 'valibot';

import { organization, emailMessage } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { emailMessageReadPermissions } from '$lib/zero/query/email_message/permissions';

export function createEmailMessage(params: MutatorParams) {
	return async function (tx: Transaction, input: CreateMutatorSchemaOutput) {
		const parsedInput = parse(createMutatorSchema, input);
		const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, parsedInput.metadata.organizationId))
			.limit(1);
		if (!organizationRecord) {
			throw new Error('Organization not found');
		}

		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				organizationRecord.id
			)
		) {
			throw new Error('You are not authorized to create an email message in this organization');
		}

		const emailMessageToCreate: typeof emailMessage.$inferInsert = {
			id: parsedInput.metadata.emailMessageId,
			organizationId: parsedInput.metadata.organizationId,
			teamId: null,
			emailFromSignatureId: parsedInput.input.emailFromSignatureId,
			replyToOverride: parsedInput.input.replyToOverride ?? null,
			recipients: parsedInput.input.recipients,
			previewTextOverride: parsedInput.input.previewTextOverride ?? null,
			previewTextLock: parsedInput.input.previewTextLock ?? false,
			subject: parsedInput.input.subject ?? null,
			body: parsedInput.input.body ?? null,
			sentBy: null,
			startedAt: null,
			completedAt: null,
			estimatedRecipientCount: 0,
			successfulRecipientCount: 0,
			failedRecipientCount: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null
		};

		const [result] = await tx.dbTransaction.wrappedTransaction
			.insert(emailMessage)
			.values(emailMessageToCreate)
			.returning();
		if (!result) {
			throw new Error('Unable to create email message');
		}

		params.result?.push(result);
	};
}

export function updateEmailMessage(params: MutatorParams) {
	return async function (tx: Transaction, input: UpdateMutatorSchemaOutput) {
		const parsed = parse(updateMutatorSchema, input);
		const emailMessageRecord = await tx.query.emailMessage
			.where('id', '=', parsed.metadata.emailMessageId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => emailMessageReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!emailMessageRecord) {
			throw new Error('Email message not found');
		}

		await tx.dbTransaction.wrappedTransaction
			.update(emailMessage)
			.set({
				...parsed.input,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(emailMessage.id, parsed.metadata.emailMessageId),
					eq(emailMessage.organizationId, parsed.metadata.organizationId)
				)
			);
	};
}

export function deleteEmailMessage(params: MutatorParams) {
	return async function (tx: Transaction, input: { id: string; organizationId: string }) {
		const emailMessageRecord = await tx.query.emailMessage
			.where('id', '=', input.id)
			.where('organizationId', '=', input.organizationId)
			.where((expr) => emailMessageReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!emailMessageRecord) {
			throw new Error('Email message not found');
		}

		await tx.dbTransaction.wrappedTransaction
			.update(emailMessage)
			.set({
				deletedAt: new Date(),
				updatedAt: new Date()
			})
			.where(
				and(eq(emailMessage.id, input.id), eq(emailMessage.organizationId, input.organizationId))
			);
	};
}
