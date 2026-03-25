import { json, error } from '@sveltejs/kit';
import { newOrganizationFromWebsiteForm } from '$lib/schema/organization.js';
import { parse } from 'valibot';
import pino from '$lib/pino';
import { env } from '$env/dynamic/private';
const log = pino(import.meta.url);
export async function POST(event) {
	try {
		const body = await event.request.json();
		const parsed = parse(newOrganizationFromWebsiteForm, body);
		const userId = event.locals.session?.session.userId;
		const userEmail = event.locals.session?.user.email;
		try {
			const webhookResponse = await fetch(`${env.ONBOARDING_WEBHOOK_URL}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user: {
						id: userId,
						email: userEmail
					},
					data: parsed
				})
			});

			if (!webhookResponse.ok) {
				try {
					const error = await webhookResponse.text();
					log.error({ error }, 'Failed to trigger webhook on workspace creation');
				} catch (err) {
					log.error('Failure on triggering webhook on workspace creation');
				}
			}
		} catch (error) {
			log.error({ error }, 'Unable to trigger webhook on workspace creation');
		}
		return json({ success: true });
	} catch (err) {
		log.error({ err }, 'Validation for onboarding webhook failed');
		return error(400, {
			message: 'Error processing onboarding details. Form details are invalid.'
		});
	}
}
