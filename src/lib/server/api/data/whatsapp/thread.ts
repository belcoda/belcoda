import {
	whatsappTemplate as whatsappTemplateTable,
	whatsappThread as whatsappThreadTable
} from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { builder } from '$lib/zero/schema';
import { whatsappThreadReadPermissions } from '$lib/zero/query/whatsapp_thread/permissions';
import { createMessageFromTemplateAndTemplateMessage } from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
import { type Flow } from '$lib/schema/flow/index';
import { getQueue } from '$lib/server/queue/index';
import {
	updateWhatsappThread as updateWhatsappThreadSchema,
	createWhatsappThread as createWhatsappThreadSchema,
	type CreateWhatsappThread as CreateWhatsappThreadSchema,
	type UpdateWhatsappThread as UpdateWhatsappThreadSchema
} from '$lib/schema/whatsapp-thread';
import { v7 as uuidv7 } from 'uuid';

import { parse } from 'valibot';
import { db } from '$lib/server/db';

export async function createWhatsappThread({
	args,
	tx
}: {
	args: {
		id: string;
		thread: CreateWhatsappThreadSchema;
		organizationId: string;
	};
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const parsed = await parse(createWhatsappThreadSchema, args.thread);
	const insertedId = args.id || uuidv7();
	const now = new Date();
	const toInsert: typeof whatsappThreadTable.$inferInsert = {
		id: insertedId,
		organizationId: args.organizationId,
		teamId: null,
		flow: parsed.flow,
		sentBy: null,
		title: null,
		description: null,
		startedAt: null,
		completedAt: null,
		estimatedRecipientCount: 0,
		successfulRecipientCount: 0,
		failedRecipientCount: 0,
		estimatedCost: null,
		totalCost: null,
		createdAt: now,
		updatedAt: now
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(whatsappThreadTable)
		.values(toInsert)
		.returning();
	if (result.length === 0) {
		throw new Error('Failed to create WhatsApp thread');
	}
	return result[0];
}

export async function updateWhatsappThread({
	args,
	tx
}: {
	args: { id: string; thread: UpdateWhatsappThreadSchema; organizationId: string };
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const parsed = await parse(updateWhatsappThreadSchema, args.thread);
	if (parsed.flow === undefined) {
		throw new Error('No fields to update');
	}

	const { title, description } = await buildThreadMetadata({
		threadId: args.id,
		organizationId: args.organizationId,
		tx,
		flow: parsed.flow
	});
	console.log('title', title);
	console.log('description', description);
	const updated = await tx.dbTransaction.wrappedTransaction
		.update(whatsappThreadTable)
		.set({
			flow: parsed.flow,
			title,
			description,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(whatsappThreadTable.id, args.id),
				eq(whatsappThreadTable.organizationId, args.organizationId)
			)
		)
		.returning();
	if (updated.length === 0) {
		throw new Error('Failed to update WhatsApp thread');
	}
	return updated[0];
}

export async function deleteWhatsappThread({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: { id: string; organizationId: string };
}) {
	const record = await tx.run(
		builder.whatsappThread
			.where('id', '=', args.id)
			.where('organizationId', '=', args.organizationId)
			.where((expr) => whatsappThreadReadPermissions(expr, ctx))
			.one()
	);
	if (!record) {
		throw new Error('WhatsApp thread not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(whatsappThreadTable)
		.set({
			deletedAt: new Date(),
			updatedAt: new Date()
		})
		.where(
			and(
				eq(whatsappThreadTable.id, args.id),
				eq(whatsappThreadTable.organizationId, args.organizationId)
			)
		);
}

export async function buildThreadMetadata({
	flow,
	organizationId,
	tx,
	threadId
}: {
	flow: Flow;
	organizationId: string;
	threadId: string;
	tx: ServerTransaction;
}) {
	const templateMessageNode = flow.nodes.find((node) => node.type === 'templateMessage');
	if (!templateMessageNode) {
		throw new Error('Template message node not found');
	}
	const templateId = templateMessageNode.data.templateId;

	const template = await tx.dbTransaction.wrappedTransaction.query.whatsappTemplate.findFirst({
		where: and(
			eq(whatsappTemplateTable.id, templateId),
			eq(whatsappTemplateTable.organizationId, organizationId)
		)
	});
	if (!template) {
		throw new Error('Template not found');
	}

	const combinedTemplateMessage = createMessageFromTemplateAndTemplateMessage({
		templateMessage: templateMessageNode.data,
		template: template.components,
		messageId: templateMessageNode.id,
		threadId: threadId
	});
	console.log('combinedTemplateMessage', combinedTemplateMessage);
	const title = combinedTemplateMessage.headerText || combinedTemplateMessage.text;
	const description = combinedTemplateMessage.headerText ? combinedTemplateMessage.text : null;
	return { title, description };
}
