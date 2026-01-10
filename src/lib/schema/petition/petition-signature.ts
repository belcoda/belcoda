import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { petitionSignatureDetails } from '$lib/schema/petition/settings';
import { readPersonZero } from '$lib/schema/person';
import { personAddedFrom } from '$lib/schema/person/meta';

import { personActionHelper } from '$lib/schema/person';

export const petitionSignatureSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),
	petitionId: helpers.uuid,
	personId: helpers.uuid,
	details: petitionSignatureDetails,
	responses: v.nullable(v.any()), // TODO: Define response schema when flows are ready
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type PetitionSignatureSchema = v.InferOutput<typeof petitionSignatureSchema>;

export const readPetitionSignatureRest = v.object({
	...v.omit(petitionSignatureSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadPetitionSignatureRest = v.InferOutput<typeof readPetitionSignatureRest>;

export const readPetitionSignatureZero = v.object({
	...petitionSignatureSchema.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadPetitionSignatureZero = v.InferOutput<typeof readPetitionSignatureZero>;

export const readPetitionSignatureZeroWithPerson = v.object({
	...readPetitionSignatureZero.entries,
	person: readPersonZero
});
export type ReadPetitionSignatureZeroWithPerson = v.InferOutput<
	typeof readPetitionSignatureZeroWithPerson
>;

export const createPetitionSignature = v.object({
	petitionId: petitionSignatureSchema.entries.petitionId,
	personId: petitionSignatureSchema.entries.personId,
	details: petitionSignatureSchema.entries.details,
	responses: v.optional(petitionSignatureSchema.entries.responses, null)
});

export type CreatePetitionSignature = v.InferInput<typeof createPetitionSignature>;

export const updatePetitionSignature = v.object({
	responses: petitionSignatureSchema.entries.responses
});
export type UpdatePetitionSignature = v.InferInput<typeof updatePetitionSignature>;

export const mutatorMetadata = v.object({
	organizationId: petitionSignatureSchema.entries.organizationId,
	petitionId: petitionSignatureSchema.entries.petitionId,
	personId: petitionSignatureSchema.entries.personId,
	petitionSignatureId: petitionSignatureSchema.entries.id
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createPetitionSignature,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updatePetitionSignature,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;

export const petitionSignatureHelper = v.object({
	person: personActionHelper,
	addedFrom: personAddedFrom,
	petitionId: helpers.uuid,
	details: petitionSignatureDetails
});
export type PetitionSignatureHelper = v.InferOutput<typeof petitionSignatureHelper>;

