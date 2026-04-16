import { parse } from 'valibot';
import { CURRENT_API_VERSION } from '$lib/schema/helpers';
import { webhookPayloadSchema, type WebhookPayload } from '$lib/schema/webhook';

import { db } from '$lib/server/db';

import pino from '$lib/pino';
const log = pino(import.meta.url);

import { sql, eq } from 'drizzle-orm';
import { webhookLog, webhook as webhookTable } from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';

export async function triggerWebhook({
	payload,
	organizationId
}: {
	payload: WebhookPayload;
	organizationId: string;
}) {
	try {
		const parsed = parse(webhookPayloadSchema, payload);
		const eventType = parsed.type;

		await db.transaction(async (tx) => {
			const returnedWebhooks = await tx.dbTransaction.wrappedTransaction.query.webhook.findMany({
				where: (row, { and, eq }) =>
					and(
						eq(row.organizationId, organizationId),
						sql`${row.eventTypes} ? ${eventType} OR ${row.eventTypes} ? 'all'`,
						eq(row.enabled, true)
					)
			});
			for (const webhook of returnedWebhooks) {
				try {
					const webhookBody = {
						id: uuidv7(),
						type: eventType,
						createdAt: new Date().toISOString(),
						apiVersion: CURRENT_API_VERSION,
						data: parsed.data
					};

					const response = await fetch(webhook.targetUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-Webhook-Secret': webhook.secret
						},
						body: JSON.stringify(webhookBody)
					});
					if (response.ok) {
						await tx.dbTransaction.wrappedTransaction
							.update(webhookTable)
							.set({
								lastSuccessAt: new Date()
							})
							.where(eq(webhookTable.id, webhook.id));
					} else {
						log.error(
							{
								status: `${response.status} ${response.statusText}`,
								webhook,
								type: eventType,
								payload: parsed.data,
								organizationId
							},
							'Failed to trigger webhook'
						);
						await tx.dbTransaction.wrappedTransaction
							.update(webhookTable)
							.set({
								lastFailureAt: new Date()
							})
							.where(eq(webhookTable.id, webhook.id));
					}

					const responseText = await response.text();
					const logToInsert: typeof webhookLog.$inferInsert = {
						id: uuidv7(),
						webhookId: webhook.id,
						eventType: eventType,
						status: response.ok ? 'success' : 'failed',
						payload: webhookBody,
						httpStatusCode: response.status,
						responseBody: responseText,
						attemptNumber: 1,
						createdAt: new Date()
					};
					await tx.dbTransaction.wrappedTransaction.insert(webhookLog).values(logToInsert);
				} catch (error) {
					log.error({ error, webhook, payload, organizationId }, 'Failed to trigger webhook');
				}
			}
		});
	} catch (error) {
		log.error({ error, payload, organizationId }, 'Failed to trigger webhook');
	}
}
