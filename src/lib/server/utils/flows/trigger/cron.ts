import { db } from '$lib/server/db';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
import { flowTriggerRegistration, flowVersion } from '$lib/schema/drizzle';
import { getNextCronRunAtUtc } from '$lib/server/utils/flows/trigger/schedule';
import { eq, and, lte, isNotNull } from 'drizzle-orm';
import pino from '$lib/pino';
const log = pino(import.meta.url);

// can be called by a cron job that runs every 10 minutes
// it finds any flow trigger registrations that have a nextRunAt that is in the past and are of type cron
// it then finds the cron trigger node for each triggerRegistration and triggers the node processing job (queued)...
// it then updates the nextRunAt for each triggerRegistration to the next run date and finishes
export async function processCronTrigger() {
	await db.transaction(async (tx) => {
		const now = new Date();
		const triggerNodes = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(flowTriggerRegistration)
			.innerJoin(flowVersion, eq(flowTriggerRegistration.flowVersionId, flowVersion.id))
			.where(
				and(
					eq(flowTriggerRegistration.triggerType, 'cron'),
					isNotNull(flowTriggerRegistration.nextRunAt),
					lte(flowTriggerRegistration.nextRunAt, now)
				)
			)
			// Scope the row lock to flowTriggerRegistration; without `of`, the FOR UPDATE would also
			// lock the joined flowVersion rows, needlessly blocking unrelated operations on them.
			.for('update', { of: flowTriggerRegistration, skipLocked: true });
		// get the next node for each triggerNode

		// queue the next node for each triggerNode in the trigger
		const queue = await getQueue();
		const promises = triggerNodes.map((triggerNode) => {
			return queue.processFlowNodeTrigger(
				{
					flowTriggerRegistrationId: triggerNode.flow_trigger_registration.id
				},
				queueSendOptionsFromTransaction(tx)
			);
		});
		await Promise.all(promises);

		// update the nextRunAt for each triggerRegistration. A single malformed registration is
		// logged and skipped rather than thrown, so one bad registration can't roll back the whole
		// batch (poison pill). A skipped registration keeps its stale nextRunAt and will simply be
		// re-selected on the next cycle — acceptable for now; more robust disabling/notifying later.
		const mapCronUpdatePromises = triggerNodes
			.map((triggerNode) => {
				try {
					const cronTriggerNode = triggerNode.flow_version.flowDefinition.nodes.find(
						(node) => node.id === triggerNode.flow_trigger_registration.triggerNodeId
					);
					if (!cronTriggerNode) {
						throw new Error(
							`Cron trigger node not found for trigger registration ${triggerNode.flow_trigger_registration.id}`
						);
					}
					if (cronTriggerNode.data.type !== 'trigger') {
						throw new Error(
							`Cron trigger node is not a trigger node for trigger registration ${triggerNode.flow_trigger_registration.id}`
						);
					}
					if (!cronTriggerNode.data.trigger) {
						throw new Error(
							`Cron trigger node is not a cron trigger node for trigger registration ${triggerNode.flow_trigger_registration.id}`
						);
					}
					if (cronTriggerNode.data.trigger.type !== 'utils.cron') {
						throw new Error(
							`Cron trigger node is not a cron trigger node for trigger registration ${triggerNode.flow_trigger_registration.id}`
						);
					}
					// Anchor to the later of the previous nextRunAt and now. If a registration was overdue
					// (e.g. the worker was down), computing purely from the stale nextRunAt could still land
					// in the past, so it would be re-selected and re-fired every cycle until it caught up.
					const previousRunAt = triggerNode.flow_trigger_registration.nextRunAt ?? now;
					const anchor = previousRunAt > now ? previousRunAt : now;
					const nextRunAt = getNextCronRunAtUtc(
						cronTriggerNode.data.trigger.cronExpression,
						anchor
					);
					return tx.dbTransaction.wrappedTransaction
						.update(flowTriggerRegistration)
						.set({
							nextRunAt: nextRunAt,
							updatedAt: new Date()
						})
						.where(eq(flowTriggerRegistration.id, triggerNode.flow_trigger_registration.id));
				} catch (error) {
					log.error(
						{ error, flowTriggerRegistrationId: triggerNode.flow_trigger_registration.id },
						'Skipping malformed cron trigger registration during nextRunAt update'
					);
					return null;
				}
			})
			.filter((promise): promise is NonNullable<typeof promise> => promise !== null);
		await Promise.all(mapCronUpdatePromises);
	});
}
