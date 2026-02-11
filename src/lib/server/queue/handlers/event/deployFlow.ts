import { event } from '$lib/schema/drizzle';
import { drizzle } from '$lib/server/db';
import { convertEventSignupFieldsToFlow } from '$lib/utils/whatsapp/flow_convert';
import { deployFlow } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
export async function deployEventWhatsAppFlow({ eventId }: { eventId: string }) {
	const eventResult = await drizzle.query.event.findFirst({
		where: (row, { eq }) => eq(row.id, eventId)
	});
	if (!eventResult) {
		throw new Error('Event not found');
	}

	const organizationResult = await drizzle.query.organization.findFirst({
		where: (row, { eq }) => eq(row.id, eventResult.organizationId)
	});
	if (!organizationResult) {
		throw new Error('Organization not found');
	}

	const wabaId = organizationResult.settings.whatsApp.wabaId || env.SYSTEM_WABA_ID;
	if (!wabaId) {
		throw new Error('Waba ID not found');
	}
	const internalFlow = convertEventSignupFieldsToFlow({
		eventId: eventResult.id,
		eventTitle: eventResult.title,
		organizationId: eventResult.organizationId,
		settings: eventResult.settings,
		existingFlowId: eventResult.settings.whatsappFlowId,
		existingFlowYCloudId: eventResult.settings.whatsappFlowYCloudId,
		existingFlowCreatedAt: eventResult.settings.whatsappFlowCreatedAt
	});

	const flow = await deployFlow({
		flow: internalFlow,
		wabaId: wabaId,
		publish: true
	});

	await drizzle
		.update(event)
		.set({
			settings: {
				...eventResult.settings,
				whatsappFlowId: flow.flowId, //this is the same as ycloudFlowId, but might be different if we ed up using different platforms.
				whatsappFlowYCloudId: flow.flowId,
				whatsappFlowCreatedAt: internalFlow.metadata.createdAt
			}
		})
		.where(eq(event.id, eventId));
	return flow;
}
