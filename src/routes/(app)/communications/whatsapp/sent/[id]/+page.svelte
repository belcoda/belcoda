<script lang="ts">
	import Flow from '$lib/components/flow/Flow.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	import { t } from '$lib/index.svelte';
	import { goto } from '$app/navigation';
	import { mutators } from '$lib/zero/mutate/client_mutators';

	const whatsappThreadQuery = $derived.by(() =>
		z.createQuery(
			queries.whatsappThread.read({
				threadId: params.id
			})
		)
	);
	import { appState } from '$lib/state.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		//if (whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data) {
		//if whatsapp thread is EXACTLY deepEqual to the starting state, delete it.
		//}
		console.log('TODO: Destroy thread');
	});
</script>

{#key params.id}
	{#if whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data}
		<Flow
			backButtonUrl="/communications/whatsapp"
			nodes={whatsappThreadQuery.data.flow.nodes}
			edges={whatsappThreadQuery.data.flow.edges}
			disabled={true}
		/>
	{:else}
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
{/key}
