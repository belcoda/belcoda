import { defineMutator } from '@rocicorp/zero';
import {
	createPetitionZeroMutatorSchema,
	updatePetitionZeroMutatorSchema,
	archivePetitionMutatorSchema,
	deletePetitionMutatorSchema
} from '$lib/schema/petition/petition';

export const createPetition = defineMutator(
	createPetitionZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petition.insert({
			id: args.metadata.petitionId,
			organizationId: args.metadata.organizationId,
			teamId: args.input.teamId || undefined,
			pointPersonId: args.input.pointPersonId,
			slug: args.input.slug,
			title: args.input.title,
			shortDescription: args.input.shortDescription,
			description: args.input.description,
			published: false,
			petitionTarget: args.input.petitionTarget,
			petitionText: args.input.petitionText,
			featureImage: args.input.featureImage,
			settings: args.input.settings,
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);

export const updatePetition = defineMutator(
	updatePetitionZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petition.update({
			id: args.metadata.petitionId,
			...args.input,
			updatedAt: Date.now()
		});
	}
);

export const archivePetition = defineMutator(
	archivePetitionMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petition.update({
			id: args.metadata.petitionId,
			archivedAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);

export const deletePetition = defineMutator(
	deletePetitionMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petition.update({
			id: args.metadata.petitionId,
			deletedAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);
