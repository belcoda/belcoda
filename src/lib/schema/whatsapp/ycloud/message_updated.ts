import * as v from 'valibot';
import { mediumString, isoTimestamp } from '$lib/schema/helpers';

/** YCloud `whatsapp.message.updated` statuses (see YCloud webhook docs). */
const ycloudOutboundMessageStatus = v.picklist(['accepted', 'sent', 'delivered', 'read', 'failed']);

/**
 * Nested `whatsappMessage` on YCloud `whatsapp.message.updated` webhooks.
 * See message.ts `_findWhatsAppMessageForYCloudStatusUpdate` for how `id` vs `externalId` map to our DB.
 */
export const whatsappMessageUpdatedObject = v.object({
	/** YCloud message resource id — stored in our `whatsapp_message.external_id` after send. */
	id: mediumString,
	status: ycloudOutboundMessageStatus,
	wamid: v.optional(mediumString),
	from: v.optional(mediumString),
	to: v.optional(mediumString),
	wabaId: v.optional(mediumString),
	/** Belcoda composite (`threadId:nodeId:messageId`) we set when sending; not our DB `external_id` column. */
	externalId: v.optional(mediumString),
	type: mediumString,
	/** Present on `delivered` / `read` events when provided by YCloud. */
	deliverTime: v.optional(isoTimestamp),
	readTime: v.optional(isoTimestamp),
	errorCode: v.optional(v.string()),
	errorMessage: v.optional(v.string())
});

export type WhatsappMessageUpdatedObject = v.InferOutput<typeof whatsappMessageUpdatedObject>;

export const messageUpdatedSchema = v.object({
	id: mediumString,
	type: v.literal('whatsapp.message.updated'),
	apiVersion: v.literal('v2'),
	createTime: isoTimestamp,
	whatsappMessage: whatsappMessageUpdatedObject
});

export type MessageUpdated = v.InferOutput<typeof messageUpdatedSchema>;
