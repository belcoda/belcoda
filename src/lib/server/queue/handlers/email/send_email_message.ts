import { type ServerTransaction } from '@rocicorp/zero';
import pino from '$lib/pino';
import { getQueue } from '$lib/server/queue';
const log = pino(import.meta.url);
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { env } from '$env/dynamic/private';
const { POSTMARK_MESSAGE_TEMPLATE_ALIAS } = env;
import LexicalHtmlRenderer from '@tryghost/kg-lexical-html-renderer';
const lexicalRenderer = new LexicalHtmlRenderer();
import { getEmailSignature } from '$lib/server/utils/email/signature';

import { emailMessage, person, organization } from '$lib/schema/drizzle';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export async function sendEmailMessage({
	emailMessageId,
	personId,
	organizationId,
	sentByUserId
}: {
	emailMessageId: string;
	personId: string;
	organizationId: string;
	sentByUserId?: string;
}) {
	try {
		const output = await db.transaction(async (tx) => {
			const org = await tx.dbTransaction.wrappedTransaction.query.organization.findFirst({
				where: eq(organization.id, organizationId)
			});
			if (!org) {
				throw new Error('Organization not found');
			}

			const emailMessageObject =
				await tx.dbTransaction.wrappedTransaction.query.emailMessage.findFirst({
					where: and(
						eq(emailMessage.id, emailMessageId),
						eq(emailMessage.organizationId, organizationId)
					)
				});
			if (!emailMessageObject) {
				throw new Error('Email message not found');
			}
			if (emailMessageObject.completedAt) {
				throw new Error('Email message already completed');
			}
			if (!emailMessageObject.startedAt) {
				throw new Error('Email message not started');
			}

			const signature = await getEmailSignature({
				emailFromSignatureId: emailMessageObject.emailFromSignatureId,
				organization: org
			});

			const recipient = await tx.dbTransaction.wrappedTransaction.query.person.findFirst({
				where: and(eq(person.id, personId), eq(person.organizationId, organizationId))
			});
			if (!recipient) {
				throw new Error('Person not found');
			}
			return {
				recipient,
				organization: org,
				emailMessage: emailMessageObject,
				signature
			};
		});

		try {
			//check it's ok to send the message

			if (!output.recipient.emailAddress) {
				throw new Error(
					'Recipient email address not found, not sending email' + output.recipient.id
				);
			}
			if (!output.recipient.subscribed) {
				throw new Error('Recipient not subscribed, not sending email' + output.recipient.id);
			}
			if (output.recipient.doNotContact) {
				throw new Error('Recipient do not contact, not sending email' + output.recipient.id);
			}

			// For now, we use a simple template. In the future, we could use
			// a custom template based on the email body (stored as Lexical JSON)
			await sendTemplateEmail({
				to: output.recipient.emailAddress,
				from: `${output.signature.name} <${output.signature.emailAddress}>`,
				replyTo: output.signature.replyTo || undefined,
				template: POSTMARK_MESSAGE_TEMPLATE_ALIAS,
				stream: 'broadcast',
				context: {
					subject: output.emailMessage.subject || '',
					body: output.emailMessage.body
						? await lexicalRenderer.render(JSON.stringify(output.emailMessage.body))
						: '',
					organizationName: output.organization.name
				}
			});
			const [updatedEmailMessage] = await db.transaction(async (tx) => {
				return await tx.dbTransaction.wrappedTransaction
					.update(emailMessage)
					.set({
						successfulRecipientCount: sql`${output.emailMessage.successfulRecipientCount} + 1`,
						updatedAt: new Date()
					})
					.where(eq(emailMessage.id, output.emailMessage.id))
					.returning();
			});
			if (!updatedEmailMessage) {
				throw new Error('Failed to update email message');
			}
			await checkAndUpdateEmailMessageSendingComplete(updatedEmailMessage);
			log.debug({ personId: output.recipient.id, emailMessageId }, 'Email sent successfully');
			try {
				const queue = await getQueue();
				await queue.insertActivity({
					organizationId,
					personId: personId,
					type: 'email_outgoing',
					referenceId: emailMessageId,
					userId: sentByUserId,
					unread: false
				});
			} catch (err) {
				log.error(
					{ err, personId: personId, emailMessageId },
					'Failed to insert activity for email send'
				);
			}
		} catch (err) {
			const [updatedEmailMessage] = await db.transaction(async (tx) => {
				return await tx.dbTransaction.wrappedTransaction
					.update(emailMessage)
					.set({
						failedRecipientCount: sql`${output.emailMessage.failedRecipientCount} + 1`,
						updatedAt: new Date()
					})
					.where(eq(emailMessage.id, output.emailMessage.id))
					.returning();
			});
			if (!updatedEmailMessage) {
				throw new Error('Failed to update email message');
			}
			await checkAndUpdateEmailMessageSendingComplete(updatedEmailMessage);
			log.error({ err, personId: output.recipient.id, emailMessageId }, 'Failed to send email');
		}
	} catch (err) {
		log.error({ err, personId, emailMessageId }, 'Failed to send email message handler');
		return;
	}
}

async function checkAndUpdateEmailMessageSendingComplete(
	emailMessageObject: typeof emailMessage.$inferSelect
) {
	if (emailMessageObject.completedAt) {
		return true;
	}
	if (
		emailMessageObject.successfulRecipientCount + emailMessageObject.failedRecipientCount >=
		emailMessageObject.estimatedRecipientCount
	) {
		await db.transaction(async (tx) => {
			const [updatedEmailMessage] = await tx.dbTransaction.wrappedTransaction
				.update(emailMessage)
				.set({
					completedAt: new Date()
				})
				.where(eq(emailMessage.id, emailMessageObject.id))
				.returning();
			if (!updatedEmailMessage) {
				throw new Error('Failed to update email message');
			}
		});
		log.debug({ emailMessageId: emailMessageObject.id }, 'Email message sending complete');
		return true;
	}
	return false;
}
