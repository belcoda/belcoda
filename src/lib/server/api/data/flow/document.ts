import { flowDocument, flowTriggerRegistration, flowVersion } from '$lib/schema/drizzle';
import { drizzle } from '$lib/server/db';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq, or, isNull, lte, sql, and } from 'drizzle-orm';
import { type QueryContext } from '$lib/zero/schema';
import { v7 as uuidv7 } from 'uuid';
import { parse } from 'valibot';
import {
	createFlowDocumentSchema,
	type CreateFlowDocumentSchemaInput
} from '$lib/schema/flow/document';

import {
	createFlowVersionSchema,
	type CreateFlowVersionSchemaInput
} from '$lib/schema/flow/version';

import { type CreateFlowTriggerRegistrationSchemaInput } from '$lib/schema/flow/trigger-registration';
import { type Flow } from '$lib/schema/flow/node/index';

import { createHash } from 'node:crypto';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function createFlowDocument({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateFlowDocumentSchemaInput;
}) {
	const parsed = parse(createFlowDocumentSchema, args);
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(parsed.organizationId)) {
		throw new Error('You are not authorized to publish this flow document');
	}
	const id = uuidv7();
	const flowToCreate: typeof flowDocument.$inferInsert = {
		...parsed,
		id,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	const [flow] = await tx.dbTransaction.wrappedTransaction
		.insert(flowDocument)
		.values(flowToCreate)
		.returning();
	if (!flow) {
		throw new Error('Failed to create flow document');
	}
	return flow;
}

export async function publishFlowDocument({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateFlowVersionSchemaInput;
}) {
	const parsed = parse(createFlowVersionSchema, args);

	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(parsed.organizationId)) {
		throw new Error('You are not authorized to publish this flow document');
	}

	if (!ctx.userId) {
		throw new Error('A user must be authenticated to publish a flow document');
	}

	const newFlowVersionId = uuidv7();

	const [flowDocumentResult] = await tx.dbTransaction.wrappedTransaction
		.update(flowDocument)
		.set({
			versionCounter: sql`${flowDocument.versionCounter} + 1`,
			updatedAt: new Date(),
			activeVersionId: newFlowVersionId,
			executionEnabled: true
		})
		.where(
			and(
				eq(flowDocument.id, parsed.flowDocumentId),
				eq(flowDocument.organizationId, parsed.organizationId)
			)
		)
		.returning();
	if (!flowDocumentResult) {
		throw new Error('Flow document not found');
	}

	const checksum = createFlowDefinitionChecksum(flowDocumentResult.draftFlowDefinition);
	const flowVersionToCreate: typeof flowVersion.$inferInsert = {
		id: newFlowVersionId,
		organizationId: parsed.organizationId,
		flowDocumentId: parsed.flowDocumentId,
		versionNumber: flowDocumentResult.versionCounter,
		flowDefinition: flowDocumentResult.draftFlowDefinition,
		schemaVersion: flowDocumentResult.schemaVersion,
		checksum: checksum,
		publishedBy: ctx.userId,
		publishedAt: new Date()
	};
	const [insertedFlowVersion] = await tx.dbTransaction.wrappedTransaction
		.insert(flowVersion)
		.values(flowVersionToCreate)
		.returning();
	if (!insertedFlowVersion) {
		throw new Error('Failed to publish flow version');
	}

	// scrap the existing triggers for the flow document, and publish new ones derived from the published flow version
	await _rationalizeTriggerRegistrations({
		flowDocumentId: parsed.flowDocumentId,
		organizationId: parsed.organizationId,
		flowVersionId: newFlowVersionId,
		flowDefinition: flowDocumentResult.draftFlowDefinition,
		tx
	});

	return flowDocumentResult;
}

export async function _rationalizeTriggerRegistrations({
	flowDocumentId,
	organizationId,
	flowVersionId,
	flowDefinition,
	tx
}: {
	flowDocumentId: string;
	organizationId: string;
	flowVersionId: string;
	flowDefinition: Flow;
	tx: ServerTransaction;
}) {
	// scrap the existing triggers for the flow document, and publish new ones derived from the published flow version
	await tx.dbTransaction.wrappedTransaction
		.delete(flowTriggerRegistration)
		.where(
			and(
				eq(flowTriggerRegistration.flowDocumentId, flowDocumentId),
				eq(flowTriggerRegistration.organizationId, organizationId)
			)
		);

	const extractedTriggerNodes = extractTriggerNodes(flowDefinition);
	const triggerNodesToPublish: (typeof flowTriggerRegistration.$inferInsert)[] =
		extractedTriggerNodes.map((triggerNode) => {
			return {
				...triggerNode,
				id: uuidv7(),
				createdAt: new Date(),
				updatedAt: new Date(),
				flowVersionId: flowVersionId,
				flowDocumentId: flowDocumentId,
				organizationId: organizationId
			};
		});
	if (triggerNodesToPublish.length > 0) {
		await tx.dbTransaction.wrappedTransaction
			.insert(flowTriggerRegistration)
			.values(triggerNodesToPublish)
			.returning();
	}
}

export async function rollbackFlowDocument({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: {
		flowDocumentId: string;
		organizationId: string;
		flowVersionId: string;
	};
}) {
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(args.organizationId)) {
		throw new Error('You are not authorized to rollback this flow document');
	}
	if (!ctx.userId) {
		throw new Error('A user must be authenticated to rollback a flow document');
	}

	const flowVersionToRollbackTo =
		await tx.dbTransaction.wrappedTransaction.query.flowVersion.findFirst({
			where: and(
				eq(flowVersion.id, args.flowVersionId),
				eq(flowVersion.organizationId, args.organizationId)
			)
		});
	if (!flowVersionToRollbackTo) {
		throw new Error('Flow version not found');
	}

	const [flowDocumentResult] = await tx.dbTransaction.wrappedTransaction
		.update(flowDocument)
		.set({
			versionCounter: sql`${flowVersionToRollbackTo.versionNumber}`,
			updatedAt: new Date(),
			activeVersionId: flowVersionToRollbackTo.id,
			executionEnabled: true
		})
		.where(
			and(
				eq(flowDocument.id, args.flowDocumentId),
				eq(flowDocument.organizationId, args.organizationId)
			)
		)
		.returning();

	await _rationalizeTriggerRegistrations({
		flowDocumentId: args.flowDocumentId,
		organizationId: args.organizationId,
		flowVersionId: flowVersionToRollbackTo.id,
		flowDefinition: flowVersionToRollbackTo.flowDefinition,
		tx
	});

	return flowDocumentResult;
}

export function extractTriggerNodes(
	flowDefinition: Flow
): CreateFlowTriggerRegistrationSchemaInput[] {
	// TODO: Implement logic for extracting trigger nodes from the flow definition and generating trigger registrations.
	const output: CreateFlowTriggerRegistrationSchemaInput[] = [];
	return [];
}

export function createFlowDefinitionChecksum(flowDefinition: Flow): string {
	function stable(value: unknown): unknown {
		if (Array.isArray(value)) {
			return value.map(stable);
		}

		if (value && typeof value === 'object') {
			return Object.fromEntries(
				Object.entries(value)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([k, v]) => [k, stable(v)])
			);
		}

		return value;
	}

	const json = JSON.stringify(stable(flowDefinition));
	return createHash('sha256').update(json).digest('hex');
}
