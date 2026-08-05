import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { parse, ValiError } from 'valibot';
import {
	linkWhatsappAccountRequestSchema,
	type LinkWhatsappAccountRequest,
	type LinkWhatsappAccountResult
} from '$lib/schema/whatsapp-account';
import pino from '$lib/pino';

const log = pino(import.meta.url);

// STUB: this endpoint stands in for the (unofficial) WhatsApp Linked Devices
// linking flow. It validates the request and returns mock account details so the
// end-to-end UI flow works. It does NOT talk to WhatsApp yet.
// TODO: perform the real device-link handshake with the linking code and return
// the actual linked account details (identifier, business flag, profile, etc.).
export async function POST(event) {
	if (!event.locals.session?.user?.id) {
		return error(401, 'Unauthorized');
	}

	// This linking flow is dev-only (the UI is guarded by the _accounts +layout.ts
	// redirect); keep the endpoint unavailable in production too.
	if (!dev) {
		return error(404, 'Not found');
	}

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		return error(400, 'Invalid request body');
	}

	let request: LinkWhatsappAccountRequest;
	try {
		request = parse(linkWhatsappAccountRequestSchema, body);
	} catch (err) {
		if (err instanceof ValiError) {
			return error(400, err.message);
		}
		throw err;
	}

	log.info({ scope: request.scope }, 'link_account stub invoked');

	// TODO: replace with the real linked-device response.
	const result: LinkWhatsappAccountResult = {
		identifier: `+000${request.code}`,
		details: {},
		metadata: {
			isBusiness: false,
			displayName: 'Linked WhatsApp account'
		}
	};

	return json(result);
}
