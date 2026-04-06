import {
	createMutatorSchema,
	updateMutatorSchema,
	deleteMutatorSchema,
	sendMutatorSchema
} from '$lib/schema/whatsapp-thread';

import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/whatsapp/thread';

export const createWhatsappThread = defineMutator(
	createMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createWhatsappThread can only be called from the server');
		}
		await dataFunctions.createWhatsappThread({
			tx,
			ctx,
			args: {
				id: args.metadata.whatsappThreadId,
				thread: args.input,
				organizationId: args.metadata.organizationId
			}
		});
	}
);

export const updateWhatsappThread = defineMutator(
	updateMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateWhatsappThread can only be called from the server');
		}
		await dataFunctions.updateWhatsappThread({
			tx,
			ctx,
			args: {
				id: args.metadata.whatsappThreadId,
				thread: args.input,
				organizationId: args.metadata.organizationId
			}
		});
	}
);

export const deleteWhatsappThread = defineMutator(
	deleteMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deleteWhatsappThread can only be called from the server');
		}
		await dataFunctions.deleteWhatsappThread({
			tx,
			ctx,
			args: { id: args.id, organizationId: args.organizationId }
		});
	}
);

export const sendWhatsappThread = defineMutator(sendMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('sendWhatsappThread can only be called from the server');
	}
	await dataFunctions.sendWhatsappThread({
		tx,
		ctx,
		args: {
			id: args.whatsappThreadId,
			organizationId: args.organizationId,
			userId: args.userId || ctx.userId
		}
	});
});
