import * as v from 'valibot';
import * as h from './helpers';

export const whatsappAccountScopes = ['user', 'organization'] as const;
export const whatsappAccountScopeSchema = v.picklist(whatsappAccountScopes);
export type WhatsappAccountScope = v.InferOutput<typeof whatsappAccountScopeSchema>;

export const whatsappAccountDetailsSchema = v.any();
export type WhatsappAccountDetails = v.InferOutput<typeof whatsappAccountDetailsSchema>;

export const whatsappAccountMetadataSchema = v.any();
export type WhatsappAccountMetadata = v.InferOutput<typeof whatsappAccountMetadataSchema>;

export const whatsappAccountSchema = v.object({
	id: h.uuid,
	referenceId: h.uuid,
	identifier: h.shortString, //phone number or whatsapp username
	scope: whatsappAccountScopeSchema,
	details: whatsappAccountDetailsSchema,
	metadata: whatsappAccountMetadataSchema,
	createdAt: h.date,
	updatedAt: h.date,
	deletedAt: v.nullable(h.date)
});
export type WhatsappAccount = v.InferOutput<typeof whatsappAccountSchema>;
