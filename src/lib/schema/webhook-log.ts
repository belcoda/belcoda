import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import {
	webhookEventSchema,
	webhookStatusSchema,
	webhookLogPayloadSchema
} from '$lib/schema/webhook';
export const webhookLogSchema = v.object({
	id: helpers.uuid,
	webhookId: helpers.uuid,
	eventType: webhookEventSchema,
	status: webhookStatusSchema,
	payload: v.nullable(webhookLogPayloadSchema),
	httpStatusCode: v.nullable(helpers.count),
	responseBody: v.nullable(helpers.longStringEmpty),
	attemptNumber: helpers.count,
	createdAt: helpers.date
});
export type WebhookLogSchema = v.InferOutput<typeof webhookLogSchema>;
