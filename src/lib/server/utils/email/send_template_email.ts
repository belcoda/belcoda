import { env } from '$env/dynamic/private';
const { POSTMARK_SERVER_TOKEN } = env;
import { type JsonSchemaObject } from '$lib/schema/helpers';
import pino from '$lib/pino';
const log = pino(import.meta.url);
export default async function sendTemplateEmail(options: {
	to: string;
	from: string;
	template: string;
	stream: 'broadcast' | 'outbound';
	context: JsonSchemaObject;
	replyTo?: string;
	//returnPath: string;
}): Promise<string> {
	const logContext = { templateAlias: options.template };
	log.debug(logContext, 'Sending template email with Postmark');

	const result = await fetch('https://api.postmarkapp.com/email/withTemplate', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN
		},
		body: JSON.stringify({
			From: options.from,
			To: options.to,
			ReplyTo: options.replyTo,
			TemplateAlias: options.template,
			TemplateModel: options.context,
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
