import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';
import {
	createPetitionZeroMutatorSchema,
	updatePetitionZeroMutatorSchema
} from '$lib/schema/petition/petition';
import { parse } from 'valibot';

export const createPetition = defineMutator(
	createPetitionZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petition.insert({
			id: args.metadata.petitionId,
			organizationId: args.metadata.organizationId,
			teamId: args.metadata.teamId,
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
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	}
);

export const updatePetition = defineMutator(
	updatePetitionZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petition.update({
			id: args.metadata.petitionId,
			...args.input,
			updatedAt: new Date().getTime()
		});
	}
);
