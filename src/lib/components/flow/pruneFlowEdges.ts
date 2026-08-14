/**
 * Shared edge-integrity helper for SvelteFlow `flow` graphs.
 *
 * The flow editor can leave an edge behind when the thing it pointed at goes
 * away: a node is created without its counterpart, a button is deleted, a
 * template is swapped (regenerating every button id), or a template loses
 * buttons upstream. Nothing in the editor reconciles the edge list against
 * those changes, so a saved flow can carry edges whose `source`/`target` node
 * or whose `sourceHandle`/`targetHandle` (a button id) no longer exists.
 *
 * `pruneDanglingEdges` removes exactly those unresolvable edges. It is the
 * single source of truth for "is this edge still wired to something real", used
 * both by the editor (after a button set changes) and by `cloneFlow` (before it
 * regenerates ids).
 *
 * The node/edge parameter types are intentionally structural — the minimal
 * shape needed to resolve references — so both the `$lib/schema/flow` types and
 * the `@xyflow/svelte` runtime types satisfy them without casting. The concrete
 * element type `E` is preserved on the way out, so callers get their own edge
 * type back untouched.
 */

/**
 * The minimal node shape needed to resolve edge references. `data` is typed as
 * a loose record so both the `$lib/schema/flow` node union and the
 * `@xyflow/svelte` runtime `Node` (whose `data` is `Record<string, unknown>`)
 * satisfy it; the button set is read defensively in `nodeHandleIds`.
 */
export type HandleBearingNode = {
	id: string;
	data?: Record<string, unknown> | null;
};

/** The minimal edge shape needed to resolve edge references. */
export type ResolvableEdge = {
	source: string;
	target: string;
	// SvelteFlow may normalise a handleless edge to `null`; `undefined` is the
	// schema/JSON shape. Both mean "no handle", so we treat them alike.
	sourceHandle?: string | null;
	targetHandle?: string | null;
};

/**
 * The set of valid source-handle ids for a node — i.e. its button ids. Nodes
 * without buttons (targeting, tagAdd, …) have no keyed handles and return an
 * empty set. Reads `data.buttons` defensively since `data` is an opaque record.
 */
export function nodeHandleIds(node: HandleBearingNode): Set<string> {
	const buttons = node.data?.buttons;
	if (!Array.isArray(buttons)) return new Set();
	const ids = new Set<string>();
	for (const button of buttons) {
		if (
			button &&
			typeof button === 'object' &&
			typeof (button as { id?: unknown }).id === 'string'
		) {
			ids.add((button as { id: string }).id);
		}
	}
	return ids;
}

export type PruneResult<E> = {
	/** Edges that still resolve — the cleaned list to use. */
	edges: E[];
	/** Edges that were dropped, for logging or assertions. */
	removed: E[];
};

/**
 * Partition `edges` into those the graph can still resolve and those it can't.
 *
 * The predicate mirrors what `cloneFlow` can remap exactly: every id an edge
 * references — `source`, `target`, and any non-null `sourceHandle`/`targetHandle`
 * — must be a KNOWN id, where "known" means a node id OR a button (handle) id
 * anywhere in the flow. Drop the edge when any referenced id is unknown; keep it
 * otherwise. A null/undefined handle just means "no handle" and never disqualifies.
 *
 * Why match against the whole id set rather than a node's own handles:
 *  - A `source`/`sourceHandle` may legitimately be a BUTTON id, not a node id.
 *    The runtime resolves a button press by matching the pressed button against
 *    BOTH `edge.source` and `edge.sourceHandle` (see incoming_message's
 *    `extractNextNodeFromButtonAction`), so a legacy edge can carry the button id
 *    directly in `source` with no handle. Requiring `source` to be a node would
 *    silently delete those real branches.
 *  - `cloneFlow` builds its old->new id map from node ids plus button ids and
 *    throws on any edge id it can't map. Pruning against that same set removes
 *    precisely the edges the remap would choke on and nothing the runtime still
 *    treats as live — so the remap's throws remain a true backstop, never a path
 *    hit by ordinary historical data.
 *
 * Pure: inputs are never mutated and surviving edges are returned by reference.
 */
export function pruneDanglingEdges<N extends HandleBearingNode, E extends ResolvableEdge>(
	nodes: readonly N[],
	edges: readonly E[]
): PruneResult<E> {
	// Every id the graph can resolve: node ids plus button (handle) ids. This is
	// the same set cloneFlow keys its remap on — see the note above.
	const knownIds = new Set<string>();
	for (const node of nodes) {
		knownIds.add(node.id);
		for (const handleId of nodeHandleIds(node)) knownIds.add(handleId);
	}

	const kept: E[] = [];
	const removed: E[] = [];

	for (const edge of edges) {
		const references = [edge.source, edge.target, edge.sourceHandle, edge.targetHandle];
		const resolvable = references.every((ref) => ref == null || knownIds.has(ref));
		if (resolvable) kept.push(edge);
		else removed.push(edge);
	}

	return { edges: kept, removed };
}

/**
 * Scoped edge cleanup for a SINGLE node whose button set just changed.
 *
 * Drops only the edges that leave `nodeId` through a button handle the node no
 * longer has — i.e. `source === nodeId` with a non-null `sourceHandle` that is
 * not in `currentButtonIds`. Everything else is kept:
 *  - handleless edges from `nodeId` (automatic continuations, resolved by
 *    `source` alone at runtime) are not button edges and are left untouched;
 *  - edges from every OTHER node are out of scope and never considered, so a
 *    button change on one node can't disturb — or persist — edges elsewhere in
 *    the graph, including ones that are only transiently dangling mid-hydration.
 *
 * This is deliberately narrower than `pruneDanglingEdges` (which is graph-wide
 * and used at clone time): editor edits should touch only the node being edited.
 * Note it matches the editor's own edge encoding (`source` = node id,
 * `sourceHandle` = button id); a legacy edge that encodes the button id directly
 * in `source` is left for the graph-wide prune at clone time. Pure.
 */
export function pruneRemovedButtonEdges<E extends ResolvableEdge>(
	nodeId: string,
	currentButtonIds: Iterable<string>,
	edges: readonly E[]
): PruneResult<E> {
	const keep = new Set(currentButtonIds);
	const kept: E[] = [];
	const removed: E[] = [];

	for (const edge of edges) {
		const orphaned =
			edge.source === nodeId && edge.sourceHandle != null && !keep.has(edge.sourceHandle);
		if (orphaned) removed.push(edge);
		else kept.push(edge);
	}

	return { edges: kept, removed };
}

/**
 * Scoped edge cleanup for a SINGLE node that now HAS buttons.
 *
 * A message/templateMessage node with no buttons renders one unkeyed bottom
 * source handle, so an edge drawn from it is handleless (`source === nodeId`,
 * null/undefined `sourceHandle`) and the runtime treats it as an automatic
 * continuation. Once the node gains buttons it switches to per-button handles and
 * stops rendering that bottom handle — the old handleless edge is now orphaned,
 * yet `pruneRemovedButtonEdges` keeps it (a handleless edge is not a button edge).
 * At runtime the flow then both sends the buttoned message AND auto-advances down
 * the stale edge, a double advance / unintended message (BEL-1058).
 *
 * This drops exactly `nodeId`'s handleless outgoing edges (`source === nodeId`
 * with a null/undefined `sourceHandle`). It is only correct once the node has ≥1
 * button — a button-less node legitimately owns a handleless continuation — so
 * callers must invoke it only on the 0 → >0 transition (or while the node has
 * buttons). Complementary to `pruneRemovedButtonEdges`, which handles the keyed
 * button edges; between them a buttoned node keeps only its per-button edges.
 * Scoped to `nodeId`; every other edge is kept. Pure.
 */
export function pruneHandlelessEdgesForButtonedNode<E extends ResolvableEdge>(
	nodeId: string,
	edges: readonly E[]
): PruneResult<E> {
	const kept: E[] = [];
	const removed: E[] = [];

	for (const edge of edges) {
		const orphaned = edge.source === nodeId && edge.sourceHandle == null;
		if (orphaned) removed.push(edge);
		else kept.push(edge);
	}

	return { edges: kept, removed };
}
