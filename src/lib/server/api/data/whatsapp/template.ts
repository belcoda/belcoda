import { whatsappTemplate as whatsappTemplateTable } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { drizzle } from '$lib/server/db';
import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import pino from '$lib/pino';
const log = pino(import.meta.url);
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import {
	updateWhatsappTemplate as updateWhatsappTemplateSchema,
	createWhatsappTemplate as createWhatsappTemplateSchema,
	type CreateWhatsappTemplate as CreateWhatsappTemplateSchema,
	type UpdateWhatsappTemplate as UpdateWhatsappTemplateSchema,
	mutatorMetadata
} from '$lib/schema/whatsapp-template';
import {
	checkWhatsappTemplateExists,
	createWhatsappTemplate as createWhatsappTemplateYCloud
} from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { v7 as uuidv7 } from 'uuid';

import { parse } from 'valibot';

export async function getWhatsappTemplateById({
	templateId,
	organizationId
}: {
	templateId: string;
	organizationId: string;
}) {
	return drizzle.query.whatsappTemplate.findFirst({
		where: and(
			eq(whatsappTemplateTable.id, templateId),
			eq(whatsappTemplateTable.organizationId, organizationId)
		)
	});
}

export async function createWhatsappTemplate({
	ctx,
	args,
	tx
}: {
	args: {
		id: string;
		template: CreateWhatsappTemplateSchema;
		organizationId: string;
	};
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const parsed = await parse(createWhatsappTemplateSchema, args.template);
	const insertedId = args.id || uuidv7();
	const toInsert: typeof whatsappTemplateTable.$inferInsert = {
		id: insertedId,
		name: parsed.name,
		locale: parsed.locale,
		components: parsed.components,
		organizationId: args.organizationId,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(whatsappTemplateTable)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create WhatsApp template');
	}
	return result[0];
}

export async function updateWhatsappTemplate({
	args,
	ctx,
	tx
}: {
	args: { id: string; template: UpdateWhatsappTemplateSchema; organizationId: string };
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const parsed = await parse(updateWhatsappTemplateSchema, args.template);
	const updated = await tx.dbTransaction.wrappedTransaction
		.update(whatsappTemplateTable)
		.set({
			components: parsed.components,
			name: parsed.name,
			locale: parsed.locale,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(whatsappTemplateTable.id, args.id),
				eq(whatsappTemplateTable.organizationId, args.organizationId)
			)
		)
		.returning();
	if (updated.length === 0) {
		throw new Error('Failed to update WhatsApp template');
	}
	return updated[0];
}

export async function submitWhatsappTemplate({
	args,
	ctx,
	tx
}: {
	args: { whatsappTemplateId: string; organizationId: string };
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const parsed = await parse(mutatorMetadata, args);

	const template = await tx.dbTransaction.wrappedTransaction.query.whatsappTemplate.findFirst({
		where: and(
			eq(whatsappTemplateTable.id, parsed.whatsappTemplateId),
			eq(whatsappTemplateTable.organizationId, parsed.organizationId)
		)
	});
	if (!template) {
		throw new Error('WhatsApp template not found');
	}
	const organization = await getOrganizationByIdUnsafe({
		organizationId: parsed.organizationId,
		tx
	});
	if (!organization.settings.whatsApp.wabaId) {
		throw new Error('WhatsApp business account not found');
	}

	const doesTemplateExist = await checkWhatsappTemplateExists({
		wabaId: organization.settings.whatsApp.wabaId,
		templateName: template.name,
		locale: template.locale
	});
	if (!doesTemplateExist) {
		await createWhatsappTemplateYCloud({
			wabaId: organization.settings.whatsApp.wabaId,
			name: template.name,
			language: template.locale,
			components: template.components
		});
	}

	const updated = await tx.dbTransaction.wrappedTransaction
		.update(whatsappTemplateTable)
		.set({
			status: 'PENDING',
			submittedForReviewAt: new Date()
		})
		.where(
			and(
				eq(whatsappTemplateTable.id, args.whatsappTemplateId),
				eq(whatsappTemplateTable.organizationId, args.organizationId)
			)
		)
		.returning();
	if (updated.length === 0) {
		throw new Error('Failed to submit WhatsApp template');
	}
}
