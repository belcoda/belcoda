<script lang="ts">
	//*
	// This component is responsible for making sure that the flow state is updated with the context in which the parent component is called changes, but the component doesn't get remounted.
	// For example, if the Flow is being used in a page, and the user navigates to the same page with different params, the FlowStateManager should update the flow state with the new context, even though the component itself doesn't get remounted.
	// */
	import { setNodes, setEdges } from '$lib/components/flow/flow_state.svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	const {
		loadFlowFunction
	}: { loadFlowFunction: () => Promise<{ nodes: Node[]; edges: Edge[] }> } = $props();
	onMount(() => {
		let cancelled = false;
		(async () => {
			try {
				const { nodes, edges } = await loadFlowFunction();
				if (cancelled) return;
				setNodes(nodes);
				setEdges(edges);
			} catch (error) {
				if (cancelled) return;
				console.error(error);
				setNodes([]);
				setEdges([]);
			}
		})();
		return () => {
			cancelled = true;
			setNodes([]);
			setEdges([]);
		};
	});
</script>
