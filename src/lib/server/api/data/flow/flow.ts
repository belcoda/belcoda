import { flow, flowDocument } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { and, eq } from 'drizzle-orm';
import { type QueryContext, builder } from '$lib/zero/schema';
import { parse } from 'valibot';
import {
	createFlowResourceZeroMutatorSchema,
	updateFlowResourceZeroMutatorSchema,
	archiveFlowResourceMutatorSchema,
	deleteFlowResourceMutatorSchema,
	type CreateFlowResourceZeroMutatorSchema,
	type UpdateFlowResourceZeroMutatorSchema,
	type ArchiveFlowResourceMutatorSchema,
	type DeleteFlowResourceMutatorSchema
} from '$lib/schema/flow/flow';
import { createFlowDocument } from '$lib/server/api/data/flow/document';
import { flowReadPermissions } from '$lib/zero/query/flow/permissions';

// Creating a flow resource also creates its backing flow_document (per the lifecycle: a flow is a
// thin owner around a document). Both ids are pre-generated client-side and carried in metadata so
// the optimistic client insert and the server insert agree on the same rows.
export async function createFlowResource({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateFlowResourceZeroMutatorSchema;
}) {
	const parsed = parse(createFlowResourceZeroMutatorSchema, args);

	// createFlowDocument enforces org admin/owner authorization and validates the team-in-org.
	const document = await createFlowDocument({
		tx,
		ctx,
		args: {
			id: parsed.metadata.flowDocumentId,
			organizationId: parsed.metadata.organizationId,
			teamId: parsed.input.teamId,
			draftFlowDefinition: { nodes: [], edges: [] }
		}
	});

	const flowToCreate: typeof flow.$inferInsert = {
		id: parsed.metadata.flowId,
		organizationId: parsed.metadata.organizationId,
		teamId: parsed.input.teamId,
		name: parsed.input.name,
		description: parsed.input.description,
		flowDocumentId: document.id,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(flow)
		.values(flowToCreate)
		.returning();
	if (!result) {
		throw new Error('Unable to create flow');
	}
	return result;
}

export async function updateFlowResource({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateFlowResourceZeroMutatorSchema;
}) {
	const parsed = parse(updateFlowResourceZeroMutatorSchema, args);
	const flowRecord = await tx.run(
		builder.flow
			.where('id', '=', parsed.metadata.flowId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => flowReadPermissions(expr, ctx))
			.one()
	);
	if (!flowRecord) {
		throw new Error('Flow not found');
	}

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(flow)
		.set({
			...parsed.input,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(flow.id, parsed.metadata.flowId),
				eq(flow.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update flow');
	}
	return result;
}

export async function archiveFlowResource({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: ArchiveFlowResourceMutatorSchema;
}) {
	const parsed = parse(archiveFlowResourceMutatorSchema, args);
	const flowRecord = await tx.run(
		builder.flow
			.where('id', '=', parsed.metadata.flowId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => flowReadPermissions(expr, ctx))
			.one()
	);
	if (!flowRecord) {
		throw new Error('Flow not found');
	}

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(flow)
		.set({ archivedAt: new Date(), updatedAt: new Date() })
		.where(
			and(
				eq(flow.id, parsed.metadata.flowId),
				eq(flow.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to archive flow');
	}
	return result;
}

// Soft-delete the flow resource and retire its document so execution stops. The
// flow_document_retired_check constraint requires executionEnabled=false whenever retiredAt is set.
export async function deleteFlowResource({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteFlowResourceMutatorSchema;
}) {
	const parsed = parse(deleteFlowResourceMutatorSchema, args);
	const flowRecord = await tx.run(
		builder.flow
			.where('id', '=', parsed.metadata.flowId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => flowReadPermissions(expr, ctx))
			.one()
	);
	if (!flowRecord) {
		throw new Error('Flow not found');
	}

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(flow)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(
			and(
				eq(flow.id, parsed.metadata.flowId),
				eq(flow.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to delete flow');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(flowDocument)
		.set({ retiredAt: new Date(), executionEnabled: false, updatedAt: new Date() })
		.where(
			and(
				eq(flowDocument.id, flowRecord.flowDocumentId),
				eq(flowDocument.organizationId, parsed.metadata.organizationId)
			)
		);

	return result;
}
