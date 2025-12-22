import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import { webhookEventsSchema, webhookStatusSchema } from '$lib/schema/webhook';
export const webhookLogSchema = v.object({
	id: helpers.uuid,
	webhookId: helpers.uuid,
	eventType: webhookEventsSchema,
	status: webhookStatusSchema,
	payload: v.nullable(helpers.jsonSchema),
	httpStatusCode: v.nullable(helpers.count),
	responseBody: v.nullable(helpers.longStringEmpty),
	attemptNumber: helpers.count,
	createdAt: helpers.date
});
export type WebhookLogSchema = v.InferOutput<typeof webhookLogSchema>;
