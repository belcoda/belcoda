<script lang="ts">
	import Flow from '$lib/components/flow/Flow.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	import { setNodes, setEdges } from '$lib/components/flow/flow_state.svelte';
	import { onMount } from 'svelte';
	let loading = $state(true);
	async function loadFlow() {
		try {
			const whatsappThread = await z.run(
				queries.whatsappThread.read({
					threadId: params.id
				})
			);
			if (whatsappThread) {
				return { nodes: whatsappThread.flow.nodes, edges: whatsappThread.flow.edges };
			} else {
				return { nodes: [], edges: [] };
			}
		} catch (error) {
			throw error;
		} finally {
			loading = false;
		}
	}
	onMount(loadFlow);
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

{#key params.id}
	{#if loading}
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{:else}
		<Flow backButtonUrl="/communications/whatsapp" disabled={true} loadFlowFunction={loadFlow} />
	{/if}
{/key}
