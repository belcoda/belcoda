import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import { get } from '$lib/utils/http';

import { petitionSettingsSchema } from './settings';
import { generatePetitionTitleAsyncSchema } from './helpers';

export const petitionSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),
	pointPersonId: v.nullable(helpers.uuid),

	slug: helpers.slug,
	title: helpers.mediumString,
	shortDescription: helpers.mediumString,
	description: v.nullable(v.any()),

	published: v.boolean(),

	petitionTarget: v.nullable(helpers.mediumString),
	petitionText: v.nullable(helpers.mediumString),

	featureImage: v.nullable(helpers.url),
	settings: petitionSettingsSchema,

	// TODO: Implement these once flows are ready
	// flowQuestions: v.nullable(v.any()),

	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date),
	archivedAt: v.nullable(helpers.date)
});
export type PetitionSchema = v.InferOutput<typeof petitionSchema>;

export const petitionApiSchema = v.object({
	...v.omit(petitionSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString),
	archivedAt: v.nullable(helpers.dateToString)
});

export const readPetitionRest = v.object({
	...petitionSchema.entries,
	createdAt: helpers.unixTimestamp,
	updatedAt: helpers.unixTimestamp,
	deletedAt: v.nullable(helpers.unixTimestamp),
	archivedAt: v.nullable(helpers.unixTimestamp)
});
export type ReadPetitionRest = v.InferOutput<typeof readPetitionRest>;

export const readPetitionZero = v.object({
	...petitionSchema.entries,
	createdAt: helpers.unixTimestamp,
	updatedAt: helpers.unixTimestamp,
	deletedAt: v.nullable(helpers.unixTimestamp),
	archivedAt: v.nullable(helpers.unixTimestamp)
});
export type ReadPetitionZero = v.InferOutput<typeof readPetitionZero>;

export const createPetition = v.object({
	title: petitionSchema.entries.title,
	slug: petitionSchema.entries.slug,
	shortDescription: petitionSchema.entries.shortDescription,
	description: v.optional(petitionSchema.entries.description, null),
	published: petitionSchema.entries.published,
	petitionTarget: v.optional(petitionSchema.entries.petitionTarget, null),
	petitionText: v.optional(petitionSchema.entries.petitionText, null),
	featureImage: v.optional(petitionSchema.entries.featureImage, null),
	settings: petitionSchema.entries.settings,
	teamId: v.optional(petitionSchema.entries.teamId, null),
	pointPersonId: v.optional(petitionSchema.entries.pointPersonId, null)
});
export type CreatePetition = v.InferInput<typeof createPetition>;

export const createPetitionZero = v.object({
	...createPetition.entries
});
export type CreatePetitionZero = v.InferOutput<typeof createPetitionZero>;

export function generateCreatePetitionZeroAsyncSchema(organizationId: string) {
	const { title, slug } = generatePetitionTitleAsyncSchema(organizationId);
	const createPetitionZeroAsync = v.objectAsync({
		...createPetitionZero.entries,
		title: title,
		slug: slug
	});
	return createPetitionZeroAsync;
}

export const updatePetition = v.partial(
	v.object({
		...createPetition.entries
	})
);
export type UpdatePetition = v.InferInput<typeof updatePetition>;

export const updatePetitionZero = v.object({
	...updatePetition.entries
});
export type UpdatePetitionZero = v.InferOutput<typeof updatePetitionZero>;

export const mutatorMetadata = v.object({
	organizationId: petitionSchema.entries.organizationId,
	petitionId: petitionSchema.entries.id
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createPetition,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const createPetitionZeroMutatorSchema = v.object({
	input: createPetitionZero,
	metadata: mutatorMetadata
});
export type CreatePetitionZeroMutatorSchema = v.InferInput<typeof createPetitionZeroMutatorSchema>;
export type CreatePetitionZeroMutatorSchemaOutput = v.InferOutput<
	typeof createPetitionZeroMutatorSchema
>;

export const updateMutatorSchema = v.object({
	input: updatePetition,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;

export const updatePetitionZeroMutatorSchema = v.object({
	input: updatePetitionZero,
	metadata: mutatorMetadata
});
export type UpdatePetitionZeroMutatorSchema = v.InferInput<typeof updatePetitionZeroMutatorSchema>;
export type UpdatePetitionZeroMutatorSchemaOutput = v.InferOutput<
	typeof updatePetitionZeroMutatorSchema
>;

// Petition Signature Schemas
export const petitionSignatureInputSchema = v.pipe(
	v.object({
		givenName: v.nullable(helpers.mediumStringEmpty),
		familyName: v.nullable(helpers.mediumStringEmpty),
		emailAddress: v.nullable(helpers.email),
		phoneNumber: v.nullable(helpers.phoneNumber),
		customFields: v.fallback(v.record(v.string(), v.any()), {})
	})
);

export type PetitionSignatureInput = v.InferOutput<typeof petitionSignatureInputSchema>;

export const archivePetitionMutatorSchema = v.object({
	metadata: mutatorMetadata
});
export type ArchivePetitionMutatorSchema = v.InferInput<typeof archivePetitionMutatorSchema>;
export type ArchivePetitionMutatorSchemaOutput = v.InferOutput<typeof archivePetitionMutatorSchema>;

export const deletePetitionMutatorSchema = v.object({
	metadata: mutatorMetadata
});
export type DeletePetitionMutatorSchema = v.InferInput<typeof deletePetitionMutatorSchema>;
export type DeletePetitionMutatorSchemaOutput = v.InferOutput<typeof deletePetitionMutatorSchema>;
