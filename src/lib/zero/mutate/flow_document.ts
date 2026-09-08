import { defineMutator } from '@rocicorp/zero';

import {
	updateFlowDocumentDraftZeroMutatorSchema,
	publishFlowDocumentZeroMutatorSchema,
	rollbackFlowDocumentZeroMutatorSchema
} from '$lib/schema/flow/document';

// Optimistic draft save: bump draftRevision from the revision the editor started at. The server does
// the authoritative compare-and-swap; if it rejects (someone else saved first), Zero rolls this back.
export const updateDraft = defineMutator(
	updateFlowDocumentDraftZeroMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.flowDocument.update({
			id: args.metadata.flowDocumentId,
			draftFlowDefinition: args.input.draftFlowDefinition,
			draftRevision: args.input.expectedDraftRevision + 1,
			updatedAt: Date.now()
		});
	}
);

// Optimistic publish: point the document at the client-pre-generated version id and enable execution.
// The flow_version row itself is server-only (not synced), so there is nothing to insert here.
export const publish = defineMutator(publishFlowDocumentZeroMutatorSchema, async ({ tx, args }) => {
	tx.mutate.flowDocument.update({
		id: args.metadata.flowDocumentId,
		activeVersionId: args.metadata.flowVersionId,
		executionEnabled: true,
		updatedAt: Date.now()
	});
});

export const rollback = defineMutator(
	rollbackFlowDocumentZeroMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.flowDocument.update({
			id: args.metadata.flowDocumentId,
			activeVersionId: args.input.flowVersionId,
			executionEnabled: true,
			updatedAt: Date.now()
		});
	}
);
