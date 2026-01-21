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

export const createEmailFromSignatureZero = v.object({
	name: emailFromSignatureSchema.entries.name,
	emailAddress: emailFromSignatureSchema.entries.emailAddress,
	replyTo: v.optional(v.nullable(emailFromSignatureSchema.entries.replyTo), null),
	returnPathDomain: v.optional(v.nullable(emailFromSignatureSchema.entries.returnPathDomain), null)
});
export type CreateEmailFromSignatureZero = v.InferOutput<typeof createEmailFromSignatureZero>;

export const updateEmailFromSignatureZero = v.partial(
	v.omit(
		v.object({
			...createEmailFromSignatureZero.entries
		}),
		['emailAddress']
	)
);
export type UpdateEmailFromSignatureZero = v.InferOutput<typeof updateEmailFromSignatureZero>;

export const createMutatorSchema = v.object({
	input: createEmailFromSignature,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const createMutatorSchemaZero = v.object({
	input: createEmailFromSignatureZero,
	metadata: mutatorMetadata
});
export type CreateMutatorSchemaZeroInput = v.InferInput<typeof createMutatorSchemaZero>;
export type CreateMutatorSchemaZeroOutput = v.InferOutput<typeof createMutatorSchemaZero>;

export const updateMutatorSchema = v.object({
	input: updateEmailFromSignature,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;

export const updateMutatorSchemaZero = v.object({
	input: updateEmailFromSignatureZero,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchemaZeroInput = v.InferInput<typeof updateMutatorSchemaZero>;
export type UpdateMutatorSchemaZeroOutput = v.InferOutput<typeof updateMutatorSchemaZero>;

export const deleteMutatorSchemaZero = v.object({
	metadata: mutatorMetadata
});
export type DeleteMutatorSchemaZero = v.InferOutput<typeof deleteMutatorSchemaZero>;

export const verifyMutatorSchemaZero = v.object({
	metadata: mutatorMetadata
});
export type VerifyMutatorSchemaZero = v.InferOutput<typeof verifyMutatorSchemaZero>;

export const setDefaultSignatureMutatorSchemaZero = v.object({
	input: v.object({
		defaultFromSignatureId: v.nullable(helpers.uuid)
	}),
	metadata: v.object({
		organizationId: emailFromSignatureSchema.entries.organizationId
	})
});
export type SetDefaultSignatureMutatorSchemaZero = v.InferOutput<
	typeof setDefaultSignatureMutatorSchemaZero
>;

export const updateSystemFromIdentityMutatorSchemaZero = v.object({
	input: v.object({
		name: v.optional(v.nullable(helpers.shortString), null),
		replyTo: v.optional(v.nullable(helpers.email), null)
	}),
	metadata: v.object({
		organizationId: emailFromSignatureSchema.entries.organizationId
	})
});
export type UpdateSystemFromIdentityMutatorSchemaZero = v.InferOutput<
	typeof updateSystemFromIdentityMutatorSchemaZero
>;
