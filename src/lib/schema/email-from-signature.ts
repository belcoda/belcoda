import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const emailFromSignatureSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),
	name: helpers.shortString,
	emailAddress: helpers.email,
	externalId: v.nullable(helpers.mediumString),
	replyTo: v.nullable(helpers.email),
	verified: v.boolean(),
	returnPathDomain: v.nullable(helpers.mediumString),
	returnPathDomainVerified: v.boolean(),
	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type EmailFromSignatureSchema = v.InferOutput<typeof emailFromSignatureSchema>;

export const readEmailFromSignatureRest = v.object({
	...v.omit(emailFromSignatureSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});
export type ReadEmailFromSignatureRest = v.InferOutput<typeof readEmailFromSignatureRest>;

export const readEmailFromSignatureZero = v.object({
	...emailFromSignatureSchema.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadEmailFromSignatureZero = v.InferOutput<typeof readEmailFromSignatureZero>;

export const createEmailFromSignature = v.object({
	name: emailFromSignatureSchema.entries.name,
	emailAddress: emailFromSignatureSchema.entries.emailAddress,
	replyTo: v.optional(v.nullable(emailFromSignatureSchema.entries.replyTo), null),
	returnPathDomain: v.optional(v.nullable(emailFromSignatureSchema.entries.returnPathDomain), null)
});
export type CreateEmailFromSignature = v.InferInput<typeof createEmailFromSignature>;

export const updateEmailFromSignature = v.partial(
	v.omit(
		v.object({
			...createEmailFromSignature.entries
		}),
		['emailAddress']
	)
);
export type UpdateEmailFromSignature = v.InferInput<typeof updateEmailFromSignature>;

export const mutatorMetadata = v.object({
	organizationId: emailFromSignatureSchema.entries.organizationId,
	emailFromSignatureId: emailFromSignatureSchema.entries.id
});

export const createMutatorSchema = v.object({
	input: createEmailFromSignature,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateEmailFromSignature,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;
