import { env } from '$env/dynamic/private';
import pino from '$lib/pino';
const log = pino(import.meta.url);

import { toPlainText } from '@better-svelte-email/server';

const POSTMARK_REQUEST_TIMEOUT_MS = 15_000;

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
	const { POSTMARK_SERVER_TOKEN } = env;
	if (!POSTMARK_SERVER_TOKEN) {
		throw new Error('POSTMARK_SERVER_TOKEN is not configured');
	}

	const logContext = { subject: options.subject };
	log.debug(logContext, 'Sending HTML email with Postmark');

	let result: Response;
	try {
		result = await fetch('https://api.postmarkapp.com/email', {
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
			}),
			signal: AbortSignal.timeout(POSTMARK_REQUEST_TIMEOUT_MS)
		});
	} catch (error) {
		// Network failure, DNS error, or the AbortSignal timeout firing. Keep the
		// same failure contract as the other error paths: log with subject context
		// (never the recipient/body) and throw the uniform error.
		log.error({ ...logContext, error }, 'Failed to send email');
		throw new Error('Failed to send email', { cause: error });
	}
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
	} else {
		log.error({ ...logContext, status: result.status }, 'Failed to send email');
		throw new Error('Failed to send email');
	}

	log.error(logContext, 'Failed to send email');
	throw new Error('Failed to send email');
}
