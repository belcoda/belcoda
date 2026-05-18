import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

const ledgerEntryMetadataTypes = [
	v.object({
		type: v.literal('added_from_stripe'),
		addedByUserId: helpers.uuid,
		stripeCheckoutSessionId: helpers.mediumStringEmpty,
		stripeWebhookDetails: v.record(v.string(), v.unknown())
	}),
	v.object({
		type: v.literal('whatsapp_message_outgoing'),
		whatsappMessageId: helpers.uuid,
		whatsappThreadId: v.nullable(helpers.uuid),
		sentByUserId: v.nullable(helpers.uuid),
		teamId: v.nullable(helpers.uuid)
	}),
	v.object({
		type: v.literal('email_message_outgoing'),
		emailMessageId: helpers.uuid,
		sentByUserId: v.nullable(helpers.uuid),
		teamId: v.nullable(helpers.uuid)
	})
];
export const ledgerEntryMetadataSchema = v.union(ledgerEntryMetadataTypes);
export type LedgerEntryMetadataSchema = v.InferOutput<typeof ledgerEntryMetadataSchema>;

export const ledgerSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	deltaInUsdHundrethsOfCents: v.pipe(v.number(), v.integer()),
	idempotencyKey: helpers.mediumStringEmpty,
	metadata: ledgerEntryMetadataSchema,
	createdAt: helpers.date
});
export type LedgerSchema = v.InferOutput<typeof ledgerSchema>;
