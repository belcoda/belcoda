<script lang="ts">
	import Flow from '$lib/components/flow/Flow.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	async function loadFlow() {
		try {
			const whatsappThread = await z.run(
				queries.whatsappThread.read({
					threadId: params.whatsappThreadId
				})
			);
			if (whatsappThread) {
				return { nodes: whatsappThread.flow.nodes, edges: whatsappThread.flow.edges };
			} else {
				return { nodes: [], edges: [] };
			}
		} catch (error) {
			throw error;
		}
	}
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

{#key params.whatsappThreadId}
	<Flow backButtonUrl="/communications/whatsapp" disabled={true} loadFlowFunction={loadFlow} />
{/key}
