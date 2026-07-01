import { drizzle as db } from '$lib/server/db';
import { whatsappTemplate, organization as organizationTable } from '$lib/schema/drizzle';
import { eq, sql, and } from 'drizzle-orm';
import type { LanguageCode } from '$lib/utils/language';

import pino from '$lib/pino';
const log = pino(import.meta.url);

// Inbound webhook payload — untrusted, so every field is optional until validated.
interface WhatsappTemplateReviewedPayload {
	type?: string;
	whatsappTemplate?: {
		status?: string;
		name?: string;
		language?: LanguageCode;
		wabaId?: string;
	};
}

// A payload that has passed validation and is guaranteed to have all required fields.
interface ApprovedTemplate {
	status: string;
	name: string;
	language: LanguageCode;
	wabaId: string;
}

async function findOrganizationByWabaId(wabaId: string, template: ApprovedTemplate) {
	const organization = await db
		.select()
		.from(organizationTable)
		.where(sql`settings->'whatsApp'->>'wabaId' = ${wabaId}`)
		.limit(1);
	if (!organization || organization.length === 0) {
		log.error({ template }, 'Organization not found');
		throw new Error('Organization not found');
	}
	if (organization.length > 1) {
		throw new Error('Multiple organizations found');
	}
	return organization[0];
}

async function setDefaultTemplateIfUnset(organizationId: string, approvedTemplateId: string) {
	return db.transaction(async (tx) => {
		const [currentOrganization] = await tx
			.select({ id: organizationTable.id, settings: organizationTable.settings })
			.from(organizationTable)
			.where(eq(organizationTable.id, organizationId))
			.limit(1);

		if (!currentOrganization) {
			throw new Error('Organization not found while setting default template');
		}

		const existingDefaultTemplateId =
			currentOrganization.settings?.whatsApp?.defaultTemplateId ?? null;
		if (existingDefaultTemplateId) {
			return false;
		}

		const updatedSettings = {
			...currentOrganization.settings,
			whatsApp: {
				...currentOrganization.settings?.whatsApp,
				defaultTemplateId: approvedTemplateId
			}
		};

		const [updated] = await tx
			.update(organizationTable)
			.set({
				settings: updatedSettings,
				updatedAt: new Date()
			})
			.where(eq(organizationTable.id, organizationId))
			.returning();
		if (!updated) {
			throw new Error('Failed to update organization');
		}
		return true;
	});
}

async function processApprovedTemplate(template: ApprovedTemplate) {
	const { wabaId, name, language } = template;

	log.info({ wabaId, templateName: name, templateLocale: language }, 'Whatsapp template approved');
	const organization = await findOrganizationByWabaId(wabaId, template);
	const organizationId = organization.id;
	log.debug({ organizationId, name, locale: language }, 'Updating whatsapp template');
	const updated = await db
		.update(whatsappTemplate)
		.set({
			status: 'APPROVED'
		})
		.where(
			and(
				eq(whatsappTemplate.organizationId, organizationId),
				eq(whatsappTemplate.name, name),
				eq(whatsappTemplate.locale, language)
			)
		)
		.returning();
	if (updated.length === 0) {
		log.warn(
			{ organizationId, name, locale: language },
			'No whatsapp template matched approved webhook payload'
		);
		return;
	}

	const approvedTemplateId = updated[0].id;
	log.info({ approvedTemplateId, organizationId }, 'Whatsapp template approved');

	const didSetDefaultTemplate = await setDefaultTemplateIfUnset(organizationId, approvedTemplateId);

	if (didSetDefaultTemplate) {
		log.info(
			{ organizationId, approvedTemplateId },
			'Set default WhatsApp template for organization'
		);
	} else {
		log.debug(
			{ organizationId, approvedTemplateId },
			'Skipped setting default WhatsApp template because it already exists'
		);
	}
}

export async function handleWhatsappTemplateReviewed(body: WhatsappTemplateReviewedPayload) {
	try {
		if (body.type !== 'whatsapp.template.reviewed') {
			return;
		}

		// Untrusted webhook payload: validate the required fields once, up front.
		const template = body.whatsappTemplate;
		if (!template || !template.status || !template.name || !template.language || !template.wabaId) {
			log.error({ body }, 'Invalid or incomplete whatsapp.template.reviewed payload');
			return;
		}
		const validated: ApprovedTemplate = {
			status: template.status,
			name: template.name,
			language: template.language,
			wabaId: template.wabaId
		};

		try {
			log.debug({ body }, 'Whatsapp template reviewed');
			if (validated.status === 'APPROVED') {
				await processApprovedTemplate(validated);
			} else {
				throw new Error('Whatsapp template not approved');
			}
		} catch (error) {
			log.error({ error }, 'Error processing whatsapp template approved webhook');
			throw error;
		}
	} catch (error) {
		log.error({ error }, 'Error processing queued template reviewed event');
	}
}
