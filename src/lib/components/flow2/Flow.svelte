<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { SvelteFlowProvider, type Node, type Edge } from '@xyflow/svelte';
	const {
		backButtonUrl,
		disabled = false,
		loadFlowFunction
	}: {
		backButtonUrl?: string;
		disabled?: boolean;
		loadFlowFunction: () => Promise<{ nodes: Node[]; edges: Edge[] }>;
	} = $props();

	import FlowStateManager from '$lib/components/flow2/StateManager.svelte';
	import FlowCanvas from '$lib/components/flow2/FlowCanvas.svelte';
</script>

<div class="h-full w-full">
	<SvelteFlowProvider>
		<FlowStateManager {loadFlowFunction} />
		<FlowCanvas {disabled} />
	</SvelteFlowProvider>
</div>
