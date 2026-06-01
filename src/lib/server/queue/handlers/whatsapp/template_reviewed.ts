import { drizzle as db } from '$lib/server/db';
import { whatsappTemplate, organization as organizationTable } from '$lib/schema/drizzle';
import { eq, sql, and } from 'drizzle-orm';

import pino from '$lib/pino';
const log = pino(import.meta.url);
export async function handleWhatsappTemplateReviewed(body: any) {
	try {
		if (body.type === 'whatsapp.template.reviewed') {
			try {
				const status = body.whatsappTemplate.status;
				log.debug({ body }, 'Whatsapp template reviewed');
				if (status === 'APPROVED') {
					const wabaId = body.whatsappTemplate?.wabaId;
					if (wabaId == null || wabaId === '') {
						log.error({ body }, 'Missing wabaId in whatsapp template reviewed webhook');
						throw new Error('Missing wabaId in whatsapp template reviewed webhook');
					}

					log.info({ body, wabaId }, 'Whatsapp template approved');
					const organization = await db
						.select()
						.from(organizationTable)
						.where(sql`settings->'whatsApp'->>'wabaId' = ${wabaId}`)
						.limit(1);
					if (!organization || organization.length === 0) {
						log.error({ body }, 'Organization not found');
						throw new Error('Organization not found');
					}
					if (organization.length > 1) {
						throw new Error('Multiple organizations found');
					}
					const organizationId = organization[0].id;
					log.debug(
						{
							organizationId,
							name: body.whatsappTemplate.name,
							locale: body.whatsappTemplate.language
						},
						'Updating whatsapp template'
					);
					const updated = await db
						.update(whatsappTemplate)
						.set({
							status: 'APPROVED'
						})
						.where(
							and(
								eq(whatsappTemplate.organizationId, organizationId),
								eq(whatsappTemplate.name, body.whatsappTemplate.name),
								eq(whatsappTemplate.locale, body.whatsappTemplate.language)
							)
						)
						.returning();
					if (updated.length === 0) {
						log.warn(
							{
								organizationId,
								name: body.whatsappTemplate.name,
								locale: body.whatsappTemplate.language
							},
							'No whatsapp template matched approved webhook payload'
						);
						return;
					}

					const approvedTemplateId = updated[0].id;
					log.info({ approvedTemplateId, organizationId }, 'Whatsapp template approved');

					const didSetDefaultTemplate = await db.transaction(async (tx) => {
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
				} else {
					throw new Error('Whatsapp template not approved');
				}
			} catch (error) {
				log.error({ error }, 'Error processing whatsapp template approved webhook');
				throw error;
			}
		}
	} catch (error) {
		log.error({ error }, 'Error processing queued template reviewed event');
	}
}
