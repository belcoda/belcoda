import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import { uuid, email as emailSchema } from '$lib/schema/helpers';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { builder } from '$lib/zero/schema';
import { emailMessageReadPermissions } from '$lib/zero/query/email_message/permissions';
import { getEmailSignature } from '$lib/server/utils/email/signature';
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { env } from '$env/dynamic/private';
import LexicalHtmlRenderer from '@tryghost/kg-lexical-html-renderer';
import { drizzle } from '$lib/server/db';
import { person, organization } from '$lib/schema/drizzle';
import { eq, and, isNull } from 'drizzle-orm';
import pino from '$lib/pino';

const log = pino(import.meta.url);
const { POSTMARK_MESSAGE_TEMPLATE_ALIAS } = env;
const lexicalRenderer = new LexicalHtmlRenderer();

const requestSchema = v.object({
	personId: uuid,
	emailAddress: emailSchema
});

export async function POST(event) {
	if (!event.locals.session?.user?.id) {
		return error(401, 'Unauthorized');
	}

	const { messageId } = event.params;
	if (!messageId) {
		return error(400, 'Email message ID is required');
	}

	let parsed: v.InferOutput<typeof requestSchema>;
	try {
		const body = await event.request.json();
		parsed = v.parse(requestSchema, body);
	} catch {
		return error(400, 'Invalid request body');
	}

	try {
		const ctx = await getQueryContext(event.locals.session.user.id);

		const emailMessageRecord = await builder.emailMessage
			.where('id', '=', messageId)
			.where((expr) => emailMessageReadPermissions(expr, ctx))
			.where('deletedAt', 'IS', null)
			.one()
			.run();

		if (!emailMessageRecord) {
			return error(404, 'Email message not found');
		}

		const org = await drizzle.query.organization.findFirst({
			where: eq(organization.id, emailMessageRecord.organizationId)
		});
		if (!org) {
			return error(404, 'Organization not found');
		}

		const recipient = await drizzle.query.person.findFirst({
			where: and(
				eq(person.id, parsed.personId),
				eq(person.organizationId, emailMessageRecord.organizationId),
				isNull(person.deletedAt)
			)
		});
		if (!recipient) {
			return error(404, 'Person not found');
		}

		const signature = await getEmailSignature({
			emailFromSignatureId: emailMessageRecord.emailFromSignatureId,
			organization: org
		});

		const body = emailMessageRecord.body
			? await lexicalRenderer.render(JSON.stringify(emailMessageRecord.body))
			: '';

		const postmarkMessageId = await sendTemplateEmail({
			to: parsed.emailAddress,
			from: `${signature.name} <${signature.emailAddress}>`,
			replyTo: signature.replyTo || undefined,
			template: POSTMARK_MESSAGE_TEMPLATE_ALIAS,
			stream: 'broadcast',
			context: {
				subject: emailMessageRecord.subject || '',
				body,
				organizationName: org.name
			}
		});

		log.debug({ messageId, emailAddress: parsed.emailAddress }, 'Test email sent successfully');

		return json({ postmarkMessageId, emailAddress: parsed.emailAddress });
	} catch (err) {
		log.error({ err, messageId }, 'Failed to send test email');
		return error(500, 'Failed to send test email');
	}
}
