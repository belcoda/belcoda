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
					log.info({ body, wabaId: body.whatsappTemplate.wabaId }, 'Whatsapp template approved');
					const organization = await db
						.select()
						.from(organizationTable)
						.where(sql`settings->'whatsApp'->>'wabaId' = ${body.whatsappTemplate.wabaId}`)
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
					log.info({ updated }, 'Whatsapp template approved');
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
