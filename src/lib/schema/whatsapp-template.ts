import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { templateMessageComponents } from '$lib/schema/whatsapp/template';
import { whatsappTemplateStatus } from '$lib/schema/whatsapp/template/status';

export const whatsappTemplateSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),
	name: helpers.shortString,
	locale: helpers.languageCode,
	components: templateMessageComponents,
	status: whatsappTemplateStatus,
	createdAt: helpers.date,
	updatedAt: helpers.date,
	submittedForReviewAt: v.nullable(helpers.date),
	deletedAt: v.nullable(helpers.date)
});
export type WhatsappTemplateSchema = v.InferOutput<typeof whatsappTemplateSchema>;

export const readWhatsappTemplateRest = v.object({
	...v.omit(whatsappTemplateSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	submittedForReviewAt: v.nullable(helpers.dateToString),
	deletedAt: v.nullable(helpers.dateToString)
});
export type ReadWhatsappTemplateRest = v.InferOutput<typeof readWhatsappTemplateRest>;

export const readWhatsappTemplateZero = v.object({
	...whatsappTemplateSchema.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	submittedForReviewAt: v.nullable(helpers.dateToTimestamp),
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadWhatsappTemplateZero = v.InferOutput<typeof readWhatsappTemplateZero>;

export const createWhatsappTemplate = v.object({
	name: whatsappTemplateSchema.entries.name,
	locale: whatsappTemplateSchema.entries.locale,
	components: whatsappTemplateSchema.entries.components
});
export type CreateWhatsappTemplate = v.InferInput<typeof createWhatsappTemplate>;

export const updateWhatsappTemplate = v.object({
	name: whatsappTemplateSchema.entries.name,
	locale: whatsappTemplateSchema.entries.locale,
	components: whatsappTemplateSchema.entries.components
});
export type UpdateWhatsappTemplate = v.InferInput<typeof updateWhatsappTemplate>;

export const mutatorMetadata = v.object({
	organizationId: whatsappTemplateSchema.entries.organizationId,
	whatsappTemplateId: whatsappTemplateSchema.entries.id
});

export const createMutatorSchema = v.object({
	input: createWhatsappTemplate,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateWhatsappTemplate,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;

export function createDefaultTemplate({
	organizationId,
	id
}: {
	organizationId: string;
	id: string;
}): ReadWhatsappTemplateZero {
	return {
		id,
		name: 'default_template',
		teamId: null,
		organizationId,
		components: [
			{
				type: 'BODY',
				text: 'Hi {{1}}, do you have a second to talk?',
				example: {
					body_text: [['Maria']]
				}
			}
		],
		locale: 'en',
		status: 'NOT_SUBMITTED',
		submittedForReviewAt: null,
		deletedAt: null,
		createdAt: new Date().getTime(),
		updatedAt: new Date().getTime()
	};
}
