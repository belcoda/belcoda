import { petition } from '$lib/schema/drizzle';
import { drizzle } from '$lib/server/db';
import { convertPetitionSignupFieldsToFlow } from '$lib/utils/whatsapp/flow_convert';
import { deployFlow } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { parse } from 'valibot';
import { petitionSettingsSchema } from '$lib/schema/petition/settings';

export async function deployPetitionWhatsAppFlow({ petitionId }: { petitionId: string }) {
	const petitionResult = await drizzle.query.petition.findFirst({
		where: (row, { eq }) => eq(row.id, petitionId)
	});
	if (!petitionResult) {
		throw new Error('Petition not found');
	}

	const organizationResult = await drizzle.query.organization.findFirst({
		where: (row, { eq }) => eq(row.id, petitionResult.organizationId)
	});
	if (!organizationResult) {
		throw new Error('Organization not found');
	}

	const wabaId = organizationResult.settings.whatsApp.wabaId || env.SYSTEM_WABA_ID;
	if (!wabaId) {
		throw new Error('Waba ID not found');
	}

	const settings = parse(petitionSettingsSchema, petitionResult.settings ?? {});

	const internalFlow = convertPetitionSignupFieldsToFlow({
		petitionId: petitionResult.id,
		petitionTitle: petitionResult.title,
		organizationId: petitionResult.organizationId,
		settings,
		existingFlowId: settings.whatsappFlowId || undefined,
		existingFlowYCloudId: settings.whatsappFlowYCloudId || undefined,
		existingFlowCreatedAt: settings.whatsappFlowCreatedAt || undefined
	});

	const flow = await deployFlow({
		flow: internalFlow,
		wabaId: wabaId,
		publish: true
	});

	await drizzle
		.update(petition)
		.set({
			settings: {
				...settings,
				whatsappFlowId: flow.flowId,
				whatsappFlowYCloudId: flow.flowId,
				whatsappFlowCreatedAt: internalFlow.metadata.createdAt
			}
		})
		.where(eq(petition.id, petitionId));
	return flow;
}
