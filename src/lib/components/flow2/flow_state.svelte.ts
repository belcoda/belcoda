// State + persistence for the flow2 editor. Copied from $lib/components/flow/flow_state.svelte.ts
// (the legacy WhatsApp-thread editor store) and rewired to persist to a flow_document's
// draftFlowDefinition via the optimistic-lock mutator, instead of whatsappThread.upsert.
//
// The graph logic (prune helpers, onbeforedelete, bridgeEdge, tainted/loading/lastSavedAt) is
// unchanged from the legacy store. Only the persistence target and the surrounding document context
// differ.
import { z } from '$lib/zero.svelte';
import { mutators } from '$lib/zero/mutate/client_mutators';
import { t } from '$lib/index.svelte';
import { FLOW_DRAFT_REVISION_CONFLICT_MESSAGE } from '$lib/schema/flow/document';
import {
	type Node,
	type Edge,
	type OnBeforeDelete,
	addEdge,
	getConnectedEdges
} from '@xyflow/svelte';
import {
	pruneRemovedButtonEdges,
	pruneHandlelessEdgesForButtonedNode
} from '$lib/components/flow/pruneFlowEdges';
import { untrack } from 'svelte';
import { useDebounce } from 'runed';
import { toast } from 'svelte-sonner';

let _nodes: Node[] = $state.raw([]);
let _edges: Edge[] = $state.raw([]);
let _tainted = $state(false);
let _loading = $state(false);
let _lastSavedAt = $state<number>(Date.now());

// Document context, set by the editor's StateManager once the flow_document is known. The document
// id is NOT in the URL (the /flow/[id] route carries the flow id), so it must be configured
// explicitly rather than read from page params like the legacy store did.
let _flowDocumentId: string | null = null;
let _organizationId: string | null = null;
// The revision the editor's current content was based on. Set on seed/reseed and bumped by exactly
// one after each of our own successful saves (matching the optimistic mutator's draftRevision + 1).
// Never synced continuously from the live query — doing so would let a concurrent writer's bump mask
// our staleness and defeat the compare-and-swap.
let _expectedRevision = 0;
// Re-seed callback (the editor's loadFlowFunction), invoked to reload the canvas after a conflict.
let _reload: (() => Promise<void>) | null = null;

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
		persist();
	}
}

export function setEdges(edges: Edge[], persistState: boolean = true) {
	_edges = edges;
	if (persistState) {
		persist();
	}
}

// Point the store at the flow_document it should save to. Call once when the editor mounts.
export function configureFlowDocument({
	flowDocumentId,
	organizationId
}: {
	flowDocumentId: string;
	organizationId: string;
}) {
	_flowDocumentId = flowDocumentId;
	_organizationId = organizationId;
}

// Register the reload callback (the editor's loadFlowFunction) used to re-seed after a conflict.
export function registerReload(reload: () => Promise<void>) {
	_reload = reload;
}

// Seed (or re-seed) the canvas from a loaded document snapshot. Sets the content without persisting
// and pins _expectedRevision to that snapshot's revision, so the two never drift.
export function seedFromDoc({
	nodes,
	edges,
	draftRevision
}: {
	nodes: Node[];
	edges: Edge[];
	draftRevision: number;
}) {
	setNodes(nodes, false);
	setEdges(edges, false);
	_expectedRevision = draftRevision;
	_tainted = false;
}

// Clear all state + document context. Call on editor unmount so a later mount can't save into the
// wrong document with a stale revision.
export function resetFlowState() {
	setNodes([], false);
	setEdges([], false);
	_flowDocumentId = null;
	_organizationId = null;
	_expectedRevision = 0;
	_reload = null;
	_tainted = false;
	_loading = false;
}

function persist() {
	// No-op until the editor has told us which document to save to.
	if (!_flowDocumentId || !_organizationId) return;
	updateDraft();
}

const updateDraft = useDebounce(
	async () => {
		if (!_flowDocumentId || !_organizationId) return;
		const flowDocumentId = _flowDocumentId;
		const organizationId = _organizationId;
		const revisionAtSave = _expectedRevision;
		try {
			_tainted = true;
			_loading = true;
			const draftFlowDefinition = $state.snapshot({ nodes: _nodes, edges: _edges });
			const result = z.mutate(
				mutators.flowDocument.updateDraft({
					input: {
						// @ts-expect-error - flow payload typing between the xyflow node/edge types and the
						// strict flowSchema node variants is not yet aligned; the server re-parses via flowSchema.
						draftFlowDefinition,
						expectedDraftRevision: revisionAtSave
					},
					metadata: { organizationId, flowDocumentId }
				})
			);
			const updated = await result.server;
			if (updated.type === 'error') {
				if (updated.error.message === FLOW_DRAFT_REVISION_CONFLICT_MESSAGE) {
					// Someone else saved first: reload the latest graph rather than clobbering their work.
					toast.error(t`This flow was changed elsewhere. Reloading the latest version.`);
					await _reload?.();
					return;
				}
				throw new Error(updated.error.message);
			}
			// Our save landed: the document is now one revision ahead, and our canvas content is exactly
			// that revision, so advance the expected revision to match.
			_expectedRevision = revisionAtSave + 1;
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

/**
 * Reconcile the edge list after a node GAINS buttons (0 → >0).
 *
 * A buttoned node renders per-button handles and no bottom handle, so any
 * handleless edge still leaving it is orphaned and would make the runtime
 * auto-advance past the buttoned message (BEL-1058). Drops just that node's
 * handleless outgoing edges; scoped to `nodeId`; a no-op (no save) when there are
 * none. Only call this once the node actually has ≥1 button — a button-less node
 * legitimately owns a handleless continuation.
 */
export function pruneHandlelessEdgesForButtons(nodeId: string) {
	// Same reasoning as pruneEdgesForButtons: read the edge list without
	// subscribing so a calling $effect doesn't re-run on unrelated canvas changes.
	const { edges: nextEdges, removed } = untrack(() =>
		pruneHandlelessEdgesForButtonedNode(nodeId, getEdges())
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
