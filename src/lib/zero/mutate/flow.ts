import { defineMutator } from '@rocicorp/zero';

import {
	createFlowResourceZeroMutatorSchema,
	updateFlowResourceZeroMutatorSchema,
	archiveFlowResourceMutatorSchema,
	deleteFlowResourceMutatorSchema,
	defaultFlowResourceName
} from '$lib/schema/flow/flow';
import { schemaVersionOptions } from '$lib/schema/flow';

// Creating a flow optimistically inserts both the flow_document (empty draft) and the flow resource
// that owns it, using the client-pre-generated ids from metadata. The server mutator writes the same
// two rows authoritatively.
export const createFlow = defineMutator(
	createFlowResourceZeroMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.flowDocument.insert({
			id: args.metadata.flowDocumentId,
			organizationId: args.metadata.organizationId,
			teamId: args.input.teamId || undefined,
			draftFlowDefinition: { nodes: [], edges: [] },
			draftRevision: 0,
			schemaVersion: schemaVersionOptions[schemaVersionOptions.length - 1],
			versionCounter: 0,
			executionEnabled: false,
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
		tx.mutate.flow.insert({
			id: args.metadata.flowId,
			organizationId: args.metadata.organizationId,
			teamId: args.input.teamId || undefined,
			name: args.input.name ?? defaultFlowResourceName,
			description: args.input.description ?? undefined,
			flowDocumentId: args.metadata.flowDocumentId,
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);

export const updateFlow = defineMutator(
	updateFlowResourceZeroMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.flow.update({
			id: args.metadata.flowId,
			...args.input,
			description: args.input.description ?? undefined,
			updatedAt: Date.now()
		});
	}
);

export const archiveFlow = defineMutator(archiveFlowResourceMutatorSchema, async ({ tx, args }) => {
	tx.mutate.flow.update({
		id: args.metadata.flowId,
		archivedAt: Date.now(),
		updatedAt: Date.now()
	});
});

// Optimistically soft-delete the flow. The server additionally retires the backing document; the
// document isn't touched optimistically here because deletion navigates away from the editor.
export const deleteFlow = defineMutator(deleteFlowResourceMutatorSchema, async ({ tx, args }) => {
	tx.mutate.flow.update({
		id: args.metadata.flowId,
		deletedAt: Date.now(),
		updatedAt: Date.now()
	});
});
