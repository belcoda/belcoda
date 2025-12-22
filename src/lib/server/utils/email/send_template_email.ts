import { env } from '$env/dynamic/private';
const { POSTMARK_SERVER_TOKEN } = env;
import pino from '$lib/pino';

import type { NumericRange } from '@sveltejs/kit';
import { type JsonSchemaObject } from '$lib/schema/helpers';

const log = pino(import.meta.url);
export default async function (options: {
	to: string;
	from: string;
	template: string;
	stream: 'broadcast' | 'outbound';
	context: JsonSchemaObject;
	//returnPath: string;
}): Promise<string> {
	log.debug(options, 'Sending template email with Postmark');

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
			TemplateAlias: options.template,
			TemplateModel: options.context,
			MessageStream: options.stream
		})
	});
	if (!result.ok) {
		if (result.status === 422) {
			const json = await result.json();
			log.error(json);
		}
		const json = await result.json();
		log.error(json);
		throw new Error('Failed to send email');
	} else {
		const json = await result.json();
		log.debug('Email sent successfully');
		log.debug(json);
		return json.MessageID;
	}
}
