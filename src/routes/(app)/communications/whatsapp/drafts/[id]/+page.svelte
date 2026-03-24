<script lang="ts">
	import Flow from '$lib/components/flow/Flow.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();

	const whatsappThreadQuery = $derived.by(() =>
		z.createQuery(
			queries.whatsappThread.read({
				threadId: params.id
			})
		)
	);
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data) {
			//if whatsapp thread is EXACTLY deepEqual to the starting state, delete it.
		}
	});
</script>

{#if whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data}
	<Flow
		backButtonUrl="/communications/whatsapp"
		nodes={whatsappThreadQuery.data.flow.nodes}
		edges={whatsappThreadQuery.data.flow.edges}
	/>
{:else}
	<Skeleton class="h-48 w-full" />
	<Skeleton class="h-48 w-full" />
	<Skeleton class="h-48 w-full" />
{/if}
