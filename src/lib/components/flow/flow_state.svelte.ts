import { z } from '$lib/zero.svelte';
import { mutators } from '$lib/zero/mutate/client_mutators';
import { page } from '$app/state';
import { appState } from '$lib/state.svelte';
import { t } from '$lib/index.svelte';
import {
	type Node,
	type Edge,
	type OnBeforeDelete,
	addEdge,
	getConnectedEdges
} from '@xyflow/svelte';
import { pruneRemovedButtonEdges } from '$lib/components/flow/pruneFlowEdges';
import { untrack } from 'svelte';
import { useDebounce } from 'runed';
import { toast } from 'svelte-sonner';

let _nodes: Node[] = $state.raw([]);
let _edges: Edge[] = $state.raw([]);
let _tainted = $state(false);
let _loading = $state(false);
let _lastSavedAt = $state<number>(Date.now());

export function isTainted(): boolean {
	return _tainted;
}

export function taint() {
	_tainted = true;
}

export function isLoading(): boolean {
	return _loading;
}

export function lastSavedAt(): number {
	return _lastSavedAt;
}

export function getNodes(): Node[] {
	return _nodes;
}

export function getEdges(): Edge[] {
	return _edges;
}

export function setNodes(nodes: Node[], persistState: boolean = true) {
	_nodes = nodes;
	if (persistState) {
		const threadId = page.params?.whatsappThreadId;
		if (threadId) {
			updateFlow(threadId);
		}
	}
}

export function setEdges(edges: Edge[], persistState: boolean = true) {
	_edges = edges;
	if (persistState) {
		const threadId = page.params?.whatsappThreadId;
		if (threadId) {
			updateFlow(threadId);
		}
	}
}

const updateFlow = useDebounce(
	async (threadId: string) => {
		try {
			_tainted = true;
			_loading = true;
			await persistFlow(threadId, { nodes: _nodes, edges: _edges });
			_tainted = false;
			_lastSavedAt = Date.now();
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : t`Changes not saved`);
		} finally {
			_loading = false;
		}
	},
	() => 1000
);

async function persistFlow(threadId: string, newFlow: { nodes: Node[]; edges: Edge[] }) {
	const whatsappThreadId = threadId;
	if (!whatsappThreadId) {
		throw new Error('Whatsapp thread ID is required');
	}
	const toUpdate = $state.snapshot(newFlow);
	const result = z.mutate(
		mutators.whatsappThread.upsert({
			metadata: {
				whatsappThreadId: whatsappThreadId,
				organizationId: appState.organizationId
			},
			input: {
				// @ts-expect-error - flow payload typing between node schema and mutator input is not yet aligned
				flow: toUpdate
			}
		})
	);
	const updated = await result.server;
	if (updated.type === 'error') {
		throw new Error(`Unable to save changes: ${updated.error.message} [${updated.error.type}] `);
	}
}

function bridgeEdge(inEdge: Edge, outEdge: Edge): Edge {
	const { source, sourceHandle } = inEdge;
	const { target, targetHandle } = outEdge;
	return {
		id: `xy-edge__${sourceHandle ?? source}--${target}`,
		source,
		target,
		...(sourceHandle ? { sourceHandle } : {}),
		...(targetHandle ? { targetHandle } : {})
	};
}

/**
 * Reconcile the edge list after ONE node's button set changes.
 *
 * Removing a button (or swapping a template, which regenerates every button id)
 * leaves behind any edge whose `sourceHandle` was one of the now-missing button
 * ids. Call this with the node's NEW button set right after updating its data;
 * it drops just that node's orphaned button edges so the saved flow never carries
 * a dangling handle. Scoped to `nodeId` — edges on other nodes are never touched
 * — and a no-op (no save) when nothing needs pruning.
 */
export function pruneEdgesForButtons(nodeId: string, buttons: { id: string }[]) {
	const buttonIds = buttons.map((b) => b.id);
	// This runs imperatively (from button edits and from TemplateMessage.commit(),
	// which itself fires inside a $effect). Read the edge list without subscribing —
	// `untrack` keeps a calling effect from taking a dependency on the edge store
	// and re-running on every unrelated canvas change.
	const { edges: nextEdges, removed } = untrack(() =>
		pruneRemovedButtonEdges(nodeId, buttonIds, getEdges())
	);
	if (removed.length > 0) {
		setEdges(nextEdges);
	}
}

export const onbeforedelete: OnBeforeDelete = async ({ nodes: deletedNodes }) => {
	const currentNodes = getNodes();
	const currentEdges = getEdges();
	let remainingNodes = [...currentNodes];

	const remainingEdges = deletedNodes.reduce((acc, node) => {
		const incomingEdges = acc.filter((edge) => edge.target === node.id);
		const outgoingEdges = acc.filter((edge) => edge.source === node.id);
		const connectedEdges = getConnectedEdges([node], acc);

		let nextEdges = acc.filter((edge) => !connectedEdges.includes(edge));

		for (const inEdge of incomingEdges) {
			for (const outEdge of outgoingEdges) {
				nextEdges = addEdge(bridgeEdge(inEdge, outEdge), nextEdges);
			}
		}

		remainingNodes = remainingNodes.filter((rn) => rn.id !== node.id);

		return nextEdges;
	}, currentEdges);
	setNodes(remainingNodes, false);
	setEdges(remainingEdges, false);
	return true;
};
