<script lang="ts">
	import Flow from '$lib/components/flow2/Flow.svelte';
</script>

<Flow loadFlowFunction={() => Promise.resolve({ nodes: [], edges: [] })} />
