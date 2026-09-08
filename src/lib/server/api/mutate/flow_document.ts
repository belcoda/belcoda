import { defineMutator } from '@rocicorp/zero';

import {
	updateFlowDocumentDraftZeroMutatorSchema,
	publishFlowDocumentZeroMutatorSchema,
	rollbackFlowDocumentZeroMutatorSchema
} from '$lib/schema/flow/document';

import * as dataFunctions from '$lib/server/api/data/flow/document';

export const updateDraft = defineMutator(
	updateFlowDocumentDraftZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateDraft can only be called from the server');
		}
		await dataFunctions.updateFlowDocumentDraft({ tx, ctx, args });
	}
);

export const publish = defineMutator(
	publishFlowDocumentZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('publish can only be called from the server');
		}
		// The publish data function creates the flow_version (append-only, server-only) and repoints
		// the document. It takes the create-version shape, with the client-pre-generated version id.
		await dataFunctions.publishFlowDocument({
			tx,
			ctx,
			args: {
				id: args.metadata.flowVersionId,
				organizationId: args.metadata.organizationId,
				flowDocumentId: args.metadata.flowDocumentId
			}
		});
	}
);

export const rollback = defineMutator(
	rollbackFlowDocumentZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('rollback can only be called from the server');
		}
		await dataFunctions.rollbackFlowDocument({
			tx,
			ctx,
			args: {
				flowDocumentId: args.metadata.flowDocumentId,
				organizationId: args.metadata.organizationId,
				flowVersionId: args.input.flowVersionId
			}
		});
	}
);
