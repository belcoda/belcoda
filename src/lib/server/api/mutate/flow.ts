import { defineMutator } from '@rocicorp/zero';

import {
	createFlowResourceZeroMutatorSchema,
	updateFlowResourceZeroMutatorSchema,
	archiveFlowResourceMutatorSchema,
	deleteFlowResourceMutatorSchema
} from '$lib/schema/flow/flow';

import * as dataFunctions from '$lib/server/api/data/flow/flow';

export const createFlow = defineMutator(
	createFlowResourceZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createFlow can only be called from the server');
		}
		await dataFunctions.createFlowResource({ tx, ctx, args });
	}
);

export const updateFlow = defineMutator(
	updateFlowResourceZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateFlow can only be called from the server');
		}
		await dataFunctions.updateFlowResource({ tx, ctx, args });
	}
);

export const archiveFlow = defineMutator(
	archiveFlowResourceMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('archiveFlow can only be called from the server');
		}
		await dataFunctions.archiveFlowResource({ tx, ctx, args });
	}
);

export const deleteFlow = defineMutator(
	deleteFlowResourceMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deleteFlow can only be called from the server');
		}
		await dataFunctions.deleteFlowResource({ tx, ctx, args });
	}
);
