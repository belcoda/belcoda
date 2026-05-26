import { type ServerTransaction } from '@rocicorp/zero';
import pino from '$lib/pino';
import { getQueue } from '$lib/server/queue';
const log = pino(import.meta.url);
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { env } from '$env/dynamic/private';
const { POSTMARK_MESSAGE_TEMPLATE_ALIAS } = env;
import { getEmailSignature } from '$lib/server/utils/email/signature';
import { renderEmailMessage } from '$lib/server/utils/email/render_email_message';

import {
	emailMessage,
	person,
	organization as organizationTable,
	user as userTable
} from '$lib/schema/drizzle';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	_createLedgerEntry,
	DEFAULT_EMAIL_COST_IN_HUNDREDTHS_OF_CENTS
} from '$lib/server/api/data/ledger';
import { _reduceFreeEmailMessageCredits } from '$lib/server/api/data/organization';

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
				where: eq(organizationTable.id, organizationId)
			});
			if (!org) {
				throw new Error('Organization not found');
			}

			const hasFreeCredit = (org.freeEmailMessageCredits ?? 0) > 0;
			const hasPaidCapacity = org.balance >= DEFAULT_EMAIL_COST_IN_HUNDREDTHS_OF_CENTS;
			if (!hasFreeCredit && !hasPaidCapacity) {
				throw new Error(
					'No free email message credits or insufficient balance to send email message'
				);
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
			const sender = sentByUserId
				? await tx.dbTransaction.wrappedTransaction.query.user.findFirst({
						where: eq(userTable.id, sentByUserId)
					})
				: null;
			return {
				recipient,
				organization: org,
				emailMessage: emailMessageObject,
				signature,
				sender
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
			const renderedEmail = await renderEmailMessage({
				subject: output.emailMessage.subject,
				body: output.emailMessage.body,
				personObject: output.recipient,
				organization: output.organization,
				sender: output.sender
			});

			await sendTemplateEmail({
				to: output.recipient.emailAddress,
				from: `${output.signature.name} <${output.signature.emailAddress}>`,
				replyTo: output.signature.replyTo || undefined,
				template: POSTMARK_MESSAGE_TEMPLATE_ALIAS,
				stream: 'broadcast',
				context: {
					subject: renderedEmail.subject,
					body: renderedEmail.body,
					organizationName: output.organization.name
				}
			});

			// Billing after delivery must not fail the send path (successfulRecipientCount).
			try {
				await db.transaction(async (tx) => {
					const claimedFreeCredit = await _reduceFreeEmailMessageCredits({
						organizationId: organizationId,
						tx
					});
					if (!claimedFreeCredit) {
						await _createLedgerEntry({
							tx,
							args: {
								organizationId: organizationId,
								deltaInUsdHundredthsOfCents: -DEFAULT_EMAIL_COST_IN_HUNDREDTHS_OF_CENTS,
								metadata: {
									toPersonId: personId,
									type: 'email_message_outgoing',
									emailMessageId: emailMessageId,
									sentByUserId: sentByUserId ?? null,
									teamId: null //for now, always null -- we don't currently support team email
								}
							}
						});
					}
				});
			} catch (err) {
				log.error(
					{ err, personId, emailMessageId, organizationId, sentByUserId },
					'Failed to bill email message after delivery'
				);
			}

			const [updatedEmailMessage] = await db.transaction(async (tx) => {
				return await tx.dbTransaction.wrappedTransaction
					.update(emailMessage)
					.set({
						successfulRecipientCount: sql`${emailMessage.successfulRecipientCount} + 1`,
						updatedAt: new Date()
					})
					.where(eq(emailMessage.id, emailMessageId))
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
						failedRecipientCount: sql`${emailMessage.failedRecipientCount} + 1`,
						updatedAt: new Date()
					})
					.where(eq(emailMessage.id, emailMessageId))
					.returning();
			});
			if (!updatedEmailMessage) {
				throw new Error('Failed to update email message');
			}
			await checkAndUpdateEmailMessageSendingComplete(updatedEmailMessage);
			log.error({ err, personId, emailMessageId }, 'Failed to send email');
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
