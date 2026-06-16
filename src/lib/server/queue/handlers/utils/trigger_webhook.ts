import { parse } from 'valibot';
import { CURRENT_API_VERSION } from '$lib/schema/helpers';
import { webhookPayloadSchema, type WebhookPayload } from '$lib/schema/webhook';

import { db, drizzle } from '$lib/server/db';

import pino from '$lib/pino';
const log = pino(import.meta.url);

import { sql, eq } from 'drizzle-orm';
import { webhookLog, webhook as webhookTable } from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';
import { getQueue } from '$lib/server/queue';

const MAX_RETRY_DELAY = 300; // 300 seconds (5 minutes) (pg-boss counts in seconds)
const MAX_RETRY_COUNT = 10;

function getRetryDelay(retryDelay: number, retryCount: number): number {
	return Math.min(
		MAX_RETRY_DELAY,
		retryDelay *
			(2 ** Math.min(16, retryCount) / 2 + (2 ** Math.min(16, retryCount) / 2) * Math.random())
	);
}

export async function triggerWebhook({
	payload,
	organizationId,
	retryDelay = 0,
	retryCount = 0
}: {
	payload: WebhookPayload;
	organizationId: string;
	retryDelay?: number;
	retryCount?: number;
}) {
	try {
		log.info(
			{
				payloadType: payload.type,
				organizationId,
				timestamp: new Date().toISOString(),
				retryDelay,
				retryCount
			},
			'Triggering webhook'
		);
		const parsed = parse(webhookPayloadSchema, payload);
		const eventType = parsed.type;

		const returnedWebhooks = await drizzle.query.webhook.findMany({
			where: (row, { and, eq }) =>
				and(
					eq(row.organizationId, organizationId),
					sql`(${row.eventTypes} ? ${eventType} OR ${row.eventTypes} ? 'all')`,
					eq(row.enabled, true)
				)
		});
		log.info({ webhooksCount: returnedWebhooks.length }, 'Found webhooks to trigger');
		for (const webhook of returnedWebhooks) {
			const webhookBody = {
				id: uuidv7(),
				type: eventType,
				createdAt: new Date().toISOString(),
				apiVersion: CURRENT_API_VERSION,
				data: parsed.data
			};
			let responseText: string = 'NOT_SENT';
			let httpStatusCode: number = 418;
			let responseOk: boolean = false;
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
			try {
				const response = await fetch(webhook.targetUrl, {
					method: 'POST',
					signal: controller.signal,
					headers: {
						'Content-Type': 'application/json',
						'X-Webhook-Secret': webhook.secret
					},
					body: JSON.stringify(webhookBody)
				});

				responseText = await response.text();
				httpStatusCode = response.status;
				responseOk = response.ok;
				if (responseOk) {
					await drizzle
						.update(webhookTable)
						.set({
							lastSuccessAt: new Date()
						})
						.where(eq(webhookTable.id, webhook.id));
				} else {
					throw new Error(
						`Webhook failed [${response.status} ${response.statusText}]: ${responseText}`
					);
				}
			} catch (error) {
				log.error(
					{
						status: `${httpStatusCode} ${responseText}`,
						webhookId: webhook.id,
						error,
						type: eventType,
						payload: parsed.data,
						organizationId,
						retryDelay,
						retryCount
					},
					'Failed to trigger webhook'
				);
				await drizzle
					.update(webhookTable)
					.set({
						lastFailureAt: new Date()
					})
					.where(eq(webhookTable.id, webhook.id));

				if (retryCount < MAX_RETRY_COUNT) {
					const queue = await getQueue();
					const newRetryDelay = getRetryDelay(retryDelay, retryCount);
					await queue.triggerWebhook(
						{
							organizationId,
							payload,
							retryDelay: newRetryDelay,
							retryCount: retryCount + 1
						},
						{
							startAfter: newRetryDelay //in seconds
						}
					);
				} else {
					log.error(
						{ webhookId: webhook.id, eventType, payload, organizationId, retryDelay, retryCount },
						'CRITICAL: Webhook failed after max retries'
					);
				}
			} finally {
				clearTimeout(timeoutId);
				try {
					const logToInsert: typeof webhookLog.$inferInsert = {
						id: uuidv7(),
						webhookId: webhook.id,
						eventType: eventType,
						status: responseOk ? 'success' : 'failed',
						payload: webhookBody,
						httpStatusCode: httpStatusCode,
						responseBody: responseText,
						attemptNumber: 1,
						createdAt: new Date()
					};
					await drizzle.insert(webhookLog).values(logToInsert);
				} catch (error) {
					log.error({ error, webhook, payload, organizationId }, 'Failed to insert webhook log');
				}
			}
		}
	} catch (error) {
		log.error({ error, payload, organizationId }, 'Failed to trigger webhook');
	}
}
