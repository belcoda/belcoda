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
			onSave={async ({ nodes, edges }) => {
				console.log('Saving thread', nodes, edges);
				await z.mutate(
					mutators.whatsappThread.update({
						metadata: {
							whatsappThreadId: params.id,
							organizationId: appState.organizationId
						},
						input: {
							flow: { nodes, edges }
						}
					})
				);
			}}
			onSend={async ({ nodes, edges }) => {
				// First che
				if (window.confirm(t`Are you sure you want to send this WhatsApp draft?`)) {
					await z.mutate(
						mutators.whatsappThread.update({
							metadata: {
								whatsappThreadId: params.id,
								organizationId: appState.organizationId
							},
							input: {
								flow: { nodes, edges }
							}
						})
					);
					console.log('Todo: Send');
				}
			}}
			onDiscard={async () => {
				z.mutate(
					mutators.whatsappThread.delete({
						id: params.id,
						organizationId: appState.organizationId
					})
				);
				await goto('/communications/whatsapp/drafts');
			}}
		/>
	{:else}
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
{/key}
