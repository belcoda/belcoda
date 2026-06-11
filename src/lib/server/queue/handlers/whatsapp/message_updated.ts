import { parse, ValiError } from 'valibot';
import { eq } from 'drizzle-orm';

import pino from '$lib/pino';
const log = pino(import.meta.url);

import { db } from '$lib/server/db';
import { whatsappMessage } from '$lib/schema/drizzle';
import { renderValiError } from '$lib/schema/helpers';
import {
	messageUpdatedSchema,
	type WhatsappMessageUpdatedObject
} from '$lib/schema/whatsapp/ycloud/message_updated';
import { whatsappMessageApiSchema, type WhatsappMessageStatus } from '$lib/schema/whatsapp-message';
import { _findWhatsAppMessageForYCloudStatusUpdate } from '$lib/server/api/data/whatsapp/message';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';

function mapYCloudStatusToInternal(
	status: WhatsappMessageUpdatedObject['status']
): WhatsappMessageStatus {
	switch (status) {
		case 'accepted':
			return 'pending';
		case 'sent':
			return 'sent';
		case 'delivered':
			return 'delivered';
		case 'read':
			return 'read';
		case 'failed':
			return 'failed';
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

function buildFailureStatusMessage(msg: WhatsappMessageUpdatedObject): string {
	const parts: string[] = [];
	if (msg.errorCode) parts.push(msg.errorCode);
	if (msg.errorMessage) parts.push(msg.errorMessage);
	return parts.join(' — ') || 'failed';
}

export async function handleWhatsappMessageUpdated(body: unknown) {
	try {
		const parsed = parse(messageUpdatedSchema, body);
		log.debug(
			{ webhookId: parsed.id, messageStatus: parsed.whatsappMessage.status },
			'YCloud whatsapp.message.updated'
		);

		const wmsg = parsed.whatsappMessage;

		// Primary: YCloud message id → our external_id. Fallback: Belcoda composite → our primary key.
		let row;
		try {
			row = await _findWhatsAppMessageForYCloudStatusUpdate({
				ycloudMessageId: wmsg.id,
				belcodaCompositeExternalId: wmsg.externalId
			});
		} catch (err) {
			log.warn(
				{ err, ycloudMessageId: wmsg.id, belcodaCompositeExternalId: wmsg.externalId },
				'Could not resolve WhatsApp message for status update'
			);
			return;
		}

		const internalStatus = mapYCloudStatusToInternal(wmsg.status);
		const now = new Date();

		const deliveredAtForRead =
			wmsg.deliverTime != null
				? new Date(wmsg.deliverTime)
				: wmsg.readTime != null
					? new Date(wmsg.readTime)
					: now;

		const updatePayload: {
			status: WhatsappMessageStatus;
			updatedAt: Date;
			statusMessage: string | null;
			wamidId?: string;
			deliveredAt?: Date;
			readAt?: Date;
		} = {
			status: internalStatus,
			updatedAt: now,
			wamidId: wmsg.wamid,
			statusMessage: internalStatus === 'failed' ? buildFailureStatusMessage(wmsg) : null
		};
		if (internalStatus === 'delivered') {
			updatePayload.deliveredAt = wmsg.deliverTime ? new Date(wmsg.deliverTime) : now;
		}
		if (internalStatus === 'read') {
			updatePayload.readAt = wmsg.readTime ? new Date(wmsg.readTime) : now;
			if (!row.deliveredAt) {
				updatePayload.deliveredAt = deliveredAtForRead;
			}
		}

		await db.transaction(async (tx) => {
			const [updatedMsg] = await tx.dbTransaction.wrappedTransaction
				.update(whatsappMessage)
				.set(updatePayload)
				.where(eq(whatsappMessage.id, row.id))
				.returning();

			if (!updatedMsg) {
				log.warn({ messageId: row.id }, 'WhatsApp message status update returned no row');
				return;
			}

			const { organizationId, externalId: _externalId, ...rest } = updatedMsg;
			const queue = await getQueue();
			await queue.triggerWebhook(
				{
					organizationId,
					payload: {
						type: 'whatsapp.message.updated',
						data: parse(whatsappMessageApiSchema, rest)
					}
				},
				queueSendOptionsFromTransaction(tx)
			);
		});
	} catch (error) {
		if (error instanceof ValiError) {
			log.error(renderValiError(error), 'Invalid whatsapp.message.updated payload');
			return;
		}
		log.error({ error }, 'Error processing whatsapp.message.updated webhook');
		throw error;
	}
}
