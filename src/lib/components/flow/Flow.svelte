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

	import FlowStateManager from '$lib/components/flow/FlowStateManager.svelte';
	import FlowCanvas from '$lib/components/flow/FlowCanvas.svelte';
</script>

<div class="h-full w-full">
	<SvelteFlowProvider>
		<FlowStateManager {loadFlowFunction} />
		<FlowCanvas {disabled} {backButtonUrl} />
	</SvelteFlowProvider>
</div>
