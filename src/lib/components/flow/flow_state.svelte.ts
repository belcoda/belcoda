import { z } from '$lib/zero.svelte';
import { mutators } from '$lib/zero/mutate/client_mutators';
import { page } from '$app/state';
import { appState } from '$lib/state.svelte';
import { t } from '$lib/index.svelte';
import { type Node, type Edge } from '@xyflow/svelte';
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

export function setNodes(nodes: Node[]) {
	_nodes = nodes;
	updateFlow();
}

export function setEdges(edges: Edge[]) {
	_edges = edges;
	updateFlow();
}

const updateFlow = useDebounce(
	async () => {
		try {
			_tainted = true;
			_loading = true;
			await persistFlow({ nodes: _nodes, edges: _edges });
			_tainted = false;
			_lastSavedAt = Date.now();
		} catch (error) {
			console.error(error);
			toast.error(t`Changes not saved`);
		} finally {
			_loading = false;
		}
	},
	() => 1000
);

async function persistFlow(newFlow: { nodes: Node[]; edges: Edge[] }) {
	const whatsappThreadId = page.params?.whatsappThreadId;
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
				//@ts-ignore
				flow: toUpdate
			}
		})
	);
	await result.server;
	return result.client;
}
