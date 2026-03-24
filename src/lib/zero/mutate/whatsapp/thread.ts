import { defineMutator } from '@rocicorp/zero';
import {
	createMutatorSchema,
	updateMutatorSchema,
	deleteMutatorSchema
} from '$lib/schema/whatsapp-thread';

const now = () => new Date().getTime();

export const createWhatsappThread = defineMutator(createMutatorSchema, async ({ tx, args }) => {
	tx.mutate.whatsappThread.insert({
		id: args.metadata.whatsappThreadId,
		organizationId: args.metadata.organizationId,
		teamId: null,
		flow: args.input.flow,
		sentBy: null,
		title: null,
		description: null,
		startedAt: null,
		completedAt: null,
		estimatedRecipientCount: 0,
		successfulRecipientCount: 0,
		failedRecipientCount: 0,
		estimatedCost: null,
		totalCost: null,
		createdAt: now(),
		updatedAt: now(),
		deletedAt: null
	});
});

export const updateWhatsappThread = defineMutator(updateMutatorSchema, async ({ tx, args }) => {
	if (args.input.flow === undefined) {
		throw new Error('updateWhatsappThread requires flow');
	}
	tx.mutate.whatsappThread.update({
		id: args.metadata.whatsappThreadId,
		flow: args.input.flow,
		updatedAt: now()
	});
});

export const deleteWhatsappThread = defineMutator(deleteMutatorSchema, async ({ tx, args }) => {
	tx.mutate.whatsappThread.update({
		id: args.id,
		organizationId: args.organizationId,
		deletedAt: now(),
		updatedAt: now()
	});
});
