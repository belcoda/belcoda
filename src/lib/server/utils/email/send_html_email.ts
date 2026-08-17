import { env } from '$env/dynamic/private';
const { POSTMARK_SERVER_TOKEN } = env;
import { type JsonSchemaObject } from '$lib/schema/helpers';
import pino from '$lib/pino';
const log = pino(import.meta.url);

import { toPlainText } from '@better-svelte-email/server';

type SendHtmlEmailOptions = {
	to: string;
	from: string;
	html: string;
	subject: string;
	stream: 'broadcast' | 'outbound';
	replyTo?: string;
	//returnPath: string;
};

export default async function sendHtmlEmail(options: SendHtmlEmailOptions): Promise<string> {
	const logContext = { to: options.to, subject: options.subject };
	log.debug(logContext, 'Sending HTML email with Postmark');

	const result = await fetch('https://api.postmarkapp.com/email', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN
		},
		body: JSON.stringify({
			From: options.from,
			To: options.to,
			Subject: options.subject,
			ReplyTo: options.replyTo,
			HtmlBody: options.html,
			TextBody: toPlainText(options.html),
			MessageStream: options.stream
		})
	});
	if (result.ok) {
		let json: unknown;
		try {
			json = await result.json();
		} catch {
			json = null;
		}
		if (
			typeof json === 'object' &&
			json !== null &&
			'MessageID' in json &&
			typeof json.MessageID === 'string'
		) {
			log.debug({ ...logContext, providerMessageId: json.MessageID }, 'Email sent successfully');
			return json.MessageID;
		}
	}

	log.error(logContext, 'Failed to send email');
	throw new Error('Failed to send email');
}
