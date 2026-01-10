import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreatePetitionZeroMutatorSchema,
	type UpdatePetitionZeroMutatorSchema,
	createPetitionZeroMutatorSchema,
	updatePetitionZeroMutatorSchema
} from '$lib/schema/petition/petition';
import { parse } from 'valibot';

export function createPetition() {
	return async function (tx: Transaction<Schema>, args: CreatePetitionZeroMutatorSchema) {
		const parsedArgs = parse(createPetitionZeroMutatorSchema, args);
		tx.mutate.petition.insert({
			id: parsedArgs.metadata.petitionId,
			organizationId: parsedArgs.metadata.organizationId,
			teamId: parsedArgs.metadata.teamId,
			pointPersonId: parsedArgs.input.pointPersonId,
			slug: parsedArgs.input.slug,
			title: parsedArgs.input.title,
			shortDescription: parsedArgs.input.shortDescription,
			description: parsedArgs.input.description,
			published: false,
			petitionTarget: parsedArgs.input.petitionTarget,
			petitionText: parsedArgs.input.petitionText,
			featureImage: parsedArgs.input.featureImage,
			settings: parsedArgs.input.settings,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	};
}

export function updatePetition() {
	return async function (tx: Transaction<Schema>, args: UpdatePetitionZeroMutatorSchema) {
		const parsed = parse(updatePetitionZeroMutatorSchema, args);
		tx.mutate.petition.update({
			id: parsed.metadata.petitionId,
			...parsed.input,
			updatedAt: new Date().getTime()
		});
	};
}
