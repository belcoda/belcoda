import { flowDocument, flowTriggerRegistration, flowVersion, team } from '$lib/schema/drizzle';
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
import { getNextCronRunAtUtc } from '$lib/server/utils/flows/trigger/schedule';

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
	// if a team is supplied, verify it belongs to this organization — the FK only enforces that the
	// team exists, not that it's in the same tenant, so an unscoped teamId could cross organizations
	if (parsed.teamId) {
		const teamRecord = await tx.dbTransaction.wrappedTransaction.query.team.findFirst({
			where: and(eq(team.id, parsed.teamId), eq(team.organizationId, parsed.organizationId))
		});
		if (!teamRecord) {
			throw new Error('Team not found for this organization');
		}
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

	// Bump the version counter first so the new version can take its number. We deliberately do NOT
	// set activeVersionId in this update: flow_document.active_version_id has a non-deferrable FK to
	// flow_version, so the version row must be inserted before the document can point at it.
	const [countedDocument] = await tx.dbTransaction.wrappedTransaction
		.update(flowDocument)
		.set({
			versionCounter: sql`${flowDocument.versionCounter} + 1`,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(flowDocument.id, parsed.flowDocumentId),
				eq(flowDocument.organizationId, parsed.organizationId)
			)
		)
		.returning();
	if (!countedDocument) {
		throw new Error('Flow document not found');
	}

	const checksum = createFlowDefinitionChecksum(countedDocument.draftFlowDefinition);
	const flowVersionToCreate: typeof flowVersion.$inferInsert = {
		id: newFlowVersionId,
		organizationId: parsed.organizationId,
		flowDocumentId: parsed.flowDocumentId,
		versionNumber: countedDocument.versionCounter,
		flowDefinition: countedDocument.draftFlowDefinition,
		schemaVersion: countedDocument.schemaVersion,
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

	// Now that the flow version row exists, point the document at it and enable execution.
	const [flowDocumentResult] = await tx.dbTransaction.wrappedTransaction
		.update(flowDocument)
		.set({
			activeVersionId: newFlowVersionId,
			executionEnabled: true,
			updatedAt: new Date()
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

	// scrap the existing triggers for the flow document, and publish new ones derived from the published flow version
	await _rationalizeTriggerRegistrations({
		flowDocumentId: parsed.flowDocumentId,
		organizationId: parsed.organizationId,
		flowVersionId: newFlowVersionId,
		flowDefinition: countedDocument.draftFlowDefinition,
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
				eq(flowVersion.organizationId, args.organizationId),
				eq(flowVersion.flowDocumentId, args.flowDocumentId)
			)
		});
	if (!flowVersionToRollbackTo) {
		throw new Error('Flow version not found');
	}

	// Repoint the active version without rewinding versionCounter: versions are append-only, so the
	// counter must stay monotonic — otherwise the next publish would reuse an existing versionNumber
	// and violate the flow_version_unique (flowDocumentId, versionNumber) constraint.
	const [flowDocumentResult] = await tx.dbTransaction.wrappedTransaction
		.update(flowDocument)
		.set({
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
	if (!flowDocumentResult) {
		throw new Error('Flow document not found');
	}

	await _rationalizeTriggerRegistrations({
		flowDocumentId: args.flowDocumentId,
		organizationId: args.organizationId,
		flowVersionId: flowVersionToRollbackTo.id,
		flowDefinition: flowVersionToRollbackTo.flowDefinition,
		tx
	});

	return flowDocumentResult;
}

// Scan the flow definition for trigger nodes and produce a trigger registration for each one whose
// trigger type has a corresponding registration type. Trigger node types that don't yet map to a
// registration type (manual, trigger words, person.created, person.addedToTeam, event.signup) are
// skipped — they are handled by other mechanisms, not the registration/cron table.
export function extractTriggerNodes(
	flowDefinition: Flow
): CreateFlowTriggerRegistrationSchemaInput[] {
	const registrations: CreateFlowTriggerRegistrationSchemaInput[] = [];
	for (const node of flowDefinition.nodes) {
		if (node.data.type !== 'trigger') {
			continue;
		}
		const trigger = node.data.trigger;
		switch (trigger.type) {
			case 'utils.cron': {
				registrations.push({
					triggerNodeId: node.id,
					triggerType: 'cron',
					referenceId: null,
					configuration: {},
					// seed the initial nextRunAt so the 10-minute cron job can pick it up
					nextRunAt: getNextCronRunAtUtc(trigger.cronExpression)
				});
				break;
			}
			case 'whatsapp.messageReceived.actionCode': {
				registrations.push({
					triggerNodeId: node.id,
					triggerType: 'whatsappMessageActionCode',
					referenceId: trigger.actionCodeId,
					configuration: {},
					nextRunAt: null
				});
				break;
			}
			default:
				break;
		}
	}
	return registrations;
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
