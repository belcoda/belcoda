import type { ServerTransaction } from '@rocicorp/zero';
import { emailMessage } from '$lib/schema/drizzle';
import { type QueryContext, builder } from '$lib/zero/schema';
import { parse } from 'valibot';
import { and, eq, isNull } from 'drizzle-orm';
import { emailMessageReadPermissions } from '$lib/zero/query/email_message/permissions';

import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';

import {
	type CreateMutatorSchemaOutput,
	type UpdateMutatorSchemaOutput,
	type SendMutatorSchemaOutput,
	createMutatorSchema,
	updateMutatorSchema,
	sendMutatorSchema,
	emailMessageWebhook
} from '$lib/schema/email-message';
import { getQueue } from '$lib/server/queue';
import { countPersonsFromFilter } from '$lib/server/utils/person/filter';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export async function createEmailMessage({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchemaOutput;
}) {
	const parsedInput = parse(createMutatorSchema, args);
	const organizationRecord = await tx.run(
		builder.organization
			.where('id', parsedInput.metadata.organizationId)
			.where((expr) => organizationReadPermissions(expr, ctx))
			.one()
	);
	if (!organizationRecord) {
		throw new Error('Organization not found');
	}
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(organizationRecord.id)) {
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

	const { organizationId, ...msgData } = result;
	try {
		const queueCreate = await getQueue();
		await queueCreate.triggerWebhook({
			organizationId,
			payload: {
				type: 'email.message.created',
				data: parse(emailMessageWebhook, msgData)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}

	return result;
}

export async function updateEmailMessage({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchemaOutput;
}) {
	const parsedInput = parse(updateMutatorSchema, args);
	const emailMessageRecord = await tx.run(
		builder.emailMessage
			.where('id', '=', parsedInput.metadata.emailMessageId)
			.where('organizationId', '=', parsedInput.metadata.organizationId)
			.where((expr) => emailMessageReadPermissions(expr, ctx))
			.one()
	);
	if (!emailMessageRecord) {
		throw new Error('Email message not found');
	}

	const [updatedMsg] = await tx.dbTransaction.wrappedTransaction
		.update(emailMessage)
		.set({
			...parsedInput.input,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(emailMessage.id, parsedInput.metadata.emailMessageId),
				eq(emailMessage.organizationId, parsedInput.metadata.organizationId)
			)
		)
		.returning();
	if (updatedMsg) {
		const { organizationId, ...msgData } = updatedMsg;
		try {
			const q = await getQueue();
			await q.triggerWebhook({
				organizationId,
				payload: {
					type: 'email.message.updated',
					data: parse(emailMessageWebhook, msgData)
				}
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}
}

export async function deleteEmailMessage({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: { id: string; organizationId: string };
}) {
	const emailMessageRecord = await tx.run(
		builder.emailMessage
			.where('id', '=', args.id)
			.where('organizationId', '=', args.organizationId)
			.where((expr) => emailMessageReadPermissions(expr, ctx))
			.one()
	);
	if (!emailMessageRecord) {
		throw new Error('Email message not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(emailMessage)
		.set({
			deletedAt: new Date(),
			updatedAt: new Date()
		})
		.where(and(eq(emailMessage.id, args.id), eq(emailMessage.organizationId, args.organizationId)));
	try {
		const queueDel = await getQueue();
		await queueDel.triggerWebhook({
			organizationId: emailMessageRecord.organizationId,
			payload: {
				type: 'email.message.deleted',
				data: { emailMessageId: args.id }
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
}

export async function sendEmailMessage({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: SendMutatorSchemaOutput;
}) {
	const parsed = parse(sendMutatorSchema, args);
	const emailMessageRecord = await tx.run(
		builder.emailMessage
			.where('id', '=', parsed.metadata.emailMessageId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => emailMessageReadPermissions(expr, ctx))
			.one()
	);
	if (!emailMessageRecord) {
		throw new Error('Email message not found');
	}

	if (emailMessageRecord.startedAt) {
		throw new Error('Email message has already been sent');
	}

	// Calculate estimated recipient count from the filter
	const estimatedRecipientCount = await countPersonsFromFilter({
		filter: emailMessageRecord.recipients,
		organizationId: parsed.metadata.organizationId,
		ctx
	});

	log.debug(
		{ emailMessageId: parsed.metadata.emailMessageId, estimatedRecipientCount },
		'Calculated estimated recipient count'
	);

	const [sentRow] = await tx.dbTransaction.wrappedTransaction
		.update(emailMessage)
		.set({
			subject: parsed.input.subject ?? emailMessageRecord.subject,
			body: parsed.input.body ?? emailMessageRecord.body,
			startedAt: new Date(),
			sentBy: ctx.userId,
			estimatedRecipientCount,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(emailMessage.id, parsed.metadata.emailMessageId),
				eq(emailMessage.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();

	// Queue the email for processing
	const queue = await getQueue();
	await queue.buildEmailMessageSendQueue({
		emailMessageId: parsed.metadata.emailMessageId,
		organizationId: parsed.metadata.organizationId
	});

	if (sentRow) {
		const { organizationId, ...msgData } = sentRow;
		try {
			await queue.triggerWebhook({
				organizationId,
				payload: {
					type: 'email.message.updated',
					data: parse(emailMessageWebhook, msgData)
				}
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}

	log.debug(
		{ emailMessageId: parsed.metadata.emailMessageId },
		'Email message queued for processing'
	);
}

/**
 * Resolves organization id for an email message by id without tenant or auth
 * filters. For trusted server callsites only (e.g. path-based org inference);
 * does not load body, recipients, or other message fields.
 */
export async function _getEmailMessageByIdUnsafeNoTenantCheck({
	emailMessageId,
	tx
}: {
	emailMessageId: string;
	tx: ServerTransaction;
}): Promise<string | null> {
	const [row] = await tx.dbTransaction.wrappedTransaction
		.select({ organizationId: emailMessage.organizationId })
		.from(emailMessage)
		.where(and(eq(emailMessage.id, emailMessageId), isNull(emailMessage.deletedAt)))
		.limit(1);
	return row?.organizationId ?? null;
}
