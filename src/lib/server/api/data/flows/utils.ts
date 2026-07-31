import { db } from '$lib/server/db';
import {
	flowExecution as flowExecutionTable,
	flowVersion as flowVersionTable,
	person as personTable
} from '$lib/schema/drizzle';
import { type Node } from '$lib/schema/flow/node/index';
import { _getFlowExecutionUnsafe } from '$lib/server/api/data/flows/execution';
import { _getFlowExecutionStepUnsafe } from '$lib/server/api/data/flows/execution_step';
import { _getFlowVersionUnsafe } from '$lib/server/api/data/flows/version';
import { _getPersonByIdUnsafe } from '$lib/server/api/data/person/person';
import { createFlowDefinitionChecksum } from '$lib/server/api/data/flows/document';

import { LRUCache } from 'lru-cache';

type FlowDetailsCacheValue = {
	flowExecution: typeof flowExecutionTable.$inferSelect;
	flowVersion: typeof flowVersionTable.$inferSelect;
	person: typeof personTable.$inferSelect;
	node: Node;
};

// a very very simple cache to just avoid re-fetching the same data over and over again.
const flowDetailsCache = new LRUCache<string, FlowDetailsCacheValue>({
	max: 100,
	ttl: 1000 * 10 // 10 seconds
});

// invalidate to be used when resources are updated. This is probably mostly useful when updating person records from inside an execution, which may impact the next steps..
export function invalidateFlowDetailsCache({
	flowExecutionId,
	personId,
	nodeId,
	organizationId,
	flowVersionId
}: {
	flowExecutionId: string;
	personId: string;
	nodeId: string;
	organizationId: string;
	flowVersionId: string;
}) {
	const cacheKey = getFlowDetailsCacheKey({
		flowExecutionId,
		personId,
		nodeId,
		organizationId,
		flowVersionId
	});
	flowDetailsCache.delete(cacheKey);
}

function getFlowDetailsCacheKey({
	flowExecutionId,
	personId,
	nodeId,
	organizationId,
	flowVersionId
}: {
	flowExecutionId: string;
	personId: string;
	nodeId: string;
	organizationId: string;
	flowVersionId: string;
}): string {
	return `${flowExecutionId}-${personId}-${nodeId}-${organizationId}-${flowVersionId}`;
}

export async function _getFlowDetailsUnsafe({
	flowExecutionId,
	personId,
	nodeId,
	organizationId,
	flowVersionId
}: {
	flowExecutionId: string;
	personId: string;
	nodeId: string;
	organizationId: string;
	flowVersionId: string;
}) {
	const cacheKey = getFlowDetailsCacheKey({
		flowExecutionId,
		personId,
		nodeId,
		organizationId,
		flowVersionId
	});
	const cachedResult = flowDetailsCache.get(cacheKey);
	if (cachedResult) {
		return cachedResult;
	}
	const result = await db.transaction(async (tx) => {
		const [flowExecution, flowVersion, person] = await Promise.all([
			_getFlowExecutionUnsafe({ tx, personId, flowExecutionId, organizationId }),
			_getFlowVersionUnsafe({ tx, organizationId, flowVersionId }),
			_getPersonByIdUnsafe({ tx, personId, organizationId })
		]);
		return {
			flowExecution,
			flowVersion,
			person
		};
	});
	const node = result.flowVersion.flowDefinition.nodes.find((node) => node.id === nodeId);
	if (!node) {
		throw new Error(`Node ${nodeId} not found`);
	}
	if (
		result.flowVersion.checksum !== createFlowDefinitionChecksum(result.flowVersion.flowDefinition)
	) {
		throw new Error(
			`Flow version ${result.flowVersion.id} has a different checksum than the flow definition`
		);
	}
	if (!node) {
		throw new Error(
			`Node ${nodeId} not found in flow ${result.flowVersion.flowDefinition} for execution ${result.flowExecution.id}`
		);
	}
	const output = {
		flowExecution: result.flowExecution,
		flowVersion: result.flowVersion,
		person: result.person,
		node
	};
	flowDetailsCache.set(cacheKey, output);
	return output;
}
