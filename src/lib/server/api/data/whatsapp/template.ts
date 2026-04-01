import { whatsappTemplate as whatsappTemplateTable } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import pino from '$lib/pino';
const log = pino(import.meta.url);

import {
	updateWhatsappTemplate as updateWhatsappTemplateSchema,
	createWhatsappTemplate as createWhatsappTemplateSchema,
	type CreateWhatsappTemplate as CreateWhatsappTemplateSchema,
	type UpdateWhatsappTemplate as UpdateWhatsappTemplateSchema
} from '$lib/schema/whatsapp-template';
import { v7 as uuidv7 } from 'uuid';

import { parse } from 'valibot';

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
