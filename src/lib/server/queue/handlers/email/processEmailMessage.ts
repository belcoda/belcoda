import { drizzle } from '$lib/server/db';
import { emailMessage, person, organization } from '$lib/schema/drizzle';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { getQueue } from '$lib/server/queue';
import { getPersonIdsFromFilter } from '$lib/server/utils/person/filter';
import { getEmailSignature } from '$lib/server/utils/email/signature';
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import pino from '$lib/pino';
import { env } from '$env/dynamic/private';
const { POSTMARK_MESSAGE_TEMPLATE_ALIAS } = env;
import LexicalHtmlRenderer from '@tryghost/kg-lexical-html-renderer';
import type { QueryContext } from '$lib/zero/schema';
const lexicalRenderer = new LexicalHtmlRenderer();

const log = pino(import.meta.url);

export async function processEmailMessage({
	emailMessageId,
	organizationId
}: {
	emailMessageId: string;
	organizationId: string;
}) {
	log.debug({ emailMessageId, organizationId }, 'Processing email message');

	const email = await drizzle.query.emailMessage.findFirst({
		where: and(eq(emailMessage.id, emailMessageId), eq(emailMessage.organizationId, organizationId))
	});

	if (!email) {
		throw new Error('Email message not found');
	}

	if (email.completedAt) {
		log.debug({ emailMessageId }, 'Email already processed, skipping');
		return;
	}

	const org = await drizzle.query.organization.findFirst({
		where: eq(organization.id, organizationId)
	});

	if (!org) {
		throw new Error('Organization not found');
	}

	const signature = await getEmailSignature({
		emailFromSignatureId: email.emailFromSignatureId,
		organization: org
	});

	// Create a system-level QueryContext for the background job
	// This grants admin permissions for the organization to access all persons
	const ctx: QueryContext = {
		userId: email.sentBy || '',
		authTeams: [],
		adminOrgs: [organizationId],
		ownerOrgs: [],
		otherOrgs: []
	};

	const personIds = await getPersonIdsFromFilter({
		filter: email.recipients,
		organizationId,
		ctx
	});

	const estimatedCount = personIds.length;

	// Update estimated recipient count
	await drizzle
		.update(emailMessage)
		.set({
			estimatedRecipientCount: estimatedCount,
			updatedAt: new Date()
		})
		.where(
			and(eq(emailMessage.id, emailMessageId), eq(emailMessage.organizationId, organizationId))
		);

	if (estimatedCount === 0) {
		log.debug({ emailMessageId }, 'No recipients found for email');
		await drizzle
			.update(emailMessage)
			.set({
				completedAt: new Date(),
				updatedAt: new Date()
			})
			.where(
				and(eq(emailMessage.id, emailMessageId), eq(emailMessage.organizationId, organizationId))
			);
		return;
	}

	const recipients = await drizzle.query.person.findMany({
		where: and(
			eq(person.organizationId, organizationId),
			inArray(person.id, personIds),
			sql`${person.emailAddress} IS NOT NULL`
		)
	});

	let successfulCount = 0;
	let failedCount = 0;

	const queue = await getQueue();

	for (const recipient of recipients) {
		if (!recipient.emailAddress) {
			log.warn(
				{ personId: recipient.id, emailMessageId },
				'Skipping recipient with no email address'
			);
			continue;
		}

		try {
			// For now, we use a simple template. In the future, we could use
			// a custom template based on the email body (stored as Lexical JSON)
			await sendTemplateEmail({
				to: recipient.emailAddress,
				from: `${signature.name} <${signature.emailAddress}>`,
				replyTo: signature.replyTo || undefined,
				template: POSTMARK_MESSAGE_TEMPLATE_ALIAS,
				stream: 'broadcast',
				context: {
					subject: email.subject || '',
					body: email.body ? await lexicalRenderer.render(JSON.stringify(email.body)) : '',
					organizationName: org.name
				}
			});

			successfulCount++;
			log.debug({ personId: recipient.id, emailMessageId }, 'Email sent successfully');
		} catch (err) {
			failedCount++;
			log.error({ err, personId: recipient.id, emailMessageId }, 'Failed to send email');
			continue;
		}

		try {
			await queue.insertActivity({
				organizationId,
				personId: recipient.id,
				type: 'email_outgoing',
				referenceId: emailMessageId,
				unread: false
			});
		} catch (err) {
			log.error(
				{ err, personId: recipient.id, emailMessageId },
				'Failed to insert activity for email send'
			);
		}
	}

	// Update final counts
	await drizzle
		.update(emailMessage)
		.set({
			successfulRecipientCount: successfulCount,
			failedRecipientCount: failedCount,
			completedAt: new Date(),
			updatedAt: new Date()
		})
		.where(
			and(eq(emailMessage.id, emailMessageId), eq(emailMessage.organizationId, organizationId))
		);

	log.debug(
		{ emailMessageId, estimatedCount, successfulCount, failedCount },
		'Email message processing completed'
	);
}
