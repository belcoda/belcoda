import { v4 as uuidv4 } from 'uuid';
import { structuredClone } from '$lib/utils/structuredClone';
import { defaultFilterGroup } from '$lib/schema/person/filter';
import type { Flow, Node, Edge } from '$lib/schema/flow/index';

/**
 * Deep-clone a SvelteFlow `flow` JSON, regenerating every id (nodes, buttons and
 * edges) so the clone shares no identifiers with the original. The input is never
 * mutated.
 *
 * - Node ids are regenerated and the old->new mapping is recorded.
 * - `message`/`templateMessage` button ids are regenerated into the same map.
 * - `targeting` nodes have their `data.filter` reset to `defaultFilterGroup`.
 * - Other node data is preserved untouched.
 * - Edges are remapped through the id map (source/target/sourceHandle) and their
 *   ids regenerated using the SvelteFlow `xy-edge__` convention.
 */
export function cloneFlow(flow: Flow): Flow {
	// Deep-clone up-front so the original is never mutated.
	const cloned = structuredClone(flow);

	// Single map of old id -> new id, covering both node ids and button ids.
	const idMap = new Map<string, string>();

	const nodes: Node[] = cloned.nodes.map((node): Node => {
		const newNodeId = uuidv4();
		idMap.set(node.id, newNodeId);

		switch (node.type) {
			case 'message':
			case 'templateMessage': {
				const buttons = node.data.buttons?.map((button) => {
					const newButtonId = uuidv4();
					idMap.set(button.id, newButtonId);
					return { ...button, id: newButtonId };
				});
				return {
					...node,
					id: newNodeId,
					data: { ...node.data, buttons }
				} as Node;
			}
			case 'targeting':
				return {
					...node,
					id: newNodeId,
					data: { ...node.data, filter: structuredClone(defaultFilterGroup) }
				};
			default:
				// eventSignup, petitionSignup, tagAdd, teamAdd: leave data untouched.
				return { ...node, id: newNodeId };
		}
	});

	const edges: Edge[] = cloned.edges.map((edge): Edge => {
		const newSource = idMap.get(edge.source);
		const newTarget = idMap.get(edge.target);
		if (newSource === undefined) {
			throw new Error(`cloneFlow: edge references unknown source node id "${edge.source}"`);
		}
		if (newTarget === undefined) {
			throw new Error(`cloneFlow: edge references unknown target node id "${edge.target}"`);
		}

		// SvelteFlow may normalise a handleless edge to `sourceHandle: null`, so treat
		// null and undefined alike (via `!= null`) rather than mistaking null for a real
		// handle id and throwing on the lookup.
		let newSourceHandle: string | undefined;
		if (edge.sourceHandle != null) {
			newSourceHandle = idMap.get(edge.sourceHandle);
			if (newSourceHandle === undefined) {
				throw new Error(
					`cloneFlow: edge references unknown sourceHandle id "${edge.sourceHandle}"`
				);
			}
		}

		// targetHandle is passed through / remapped defensively when present.
		let newTargetHandle: string | undefined;
		if (edge.targetHandle != null) {
			newTargetHandle = idMap.get(edge.targetHandle) ?? edge.targetHandle;
		}

		const remapped: Edge = {
			...edge,
			id: `xy-edge__${newSourceHandle ?? newSource}--${newTarget}`,
			source: newSource,
			target: newTarget
		};
		// Control handle presence explicitly: the `...edge` spread may carry a null or
		// stale handle, so drop it when there is no remapped handle rather than leaking
		// it into the clone.
		if (newSourceHandle === undefined) delete remapped.sourceHandle;
		else remapped.sourceHandle = newSourceHandle;
		if (newTargetHandle === undefined) delete remapped.targetHandle;
		else remapped.targetHandle = newTargetHandle;
		return remapped;
	});

	return { nodes, edges };
}
