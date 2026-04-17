<script lang="ts">
	import Flow from '$lib/components/flow/Flow.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	import { t } from '$lib/index.svelte';
	import { goto } from '$app/navigation';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
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
	let showTestWhatsApp = $state(false);
	onDestroy(() => {
		//if (whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data) {
		//if whatsapp thread is EXACTLY deepEqual to the starting state, delete it.
		//}
		console.log('TODO: Destroy thread');
	});
</script>

{#key params.id}
	{#if whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data}
		<div class="mb-4 flex justify-end">
			<Button variant="outline" size="sm" onclick={() => (showTestWhatsApp = !showTestWhatsApp)}>
				<FlaskConicalIcon class="size-4" />
				{t`Test WhatsApp`}
			</Button>
		</div>
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
					const result = z.mutate(
						mutators.whatsappThread.send({
							whatsappThreadId: params.id,
							organizationId: appState.organizationId,
							userId: appState.userId
						})
					);

					await result.client;
					await tick();
					await goto(`/communications/whatsapp/sent/${params.id}`);
					toast.success(t`WhatsApp draft sent successfully`);
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
		{#if showTestWhatsApp}
			<div class="mt-4 rounded-lg border p-4">TODO: Test WhatsApp message panel here</div>
		{/if}
	{:else}
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
{/key}
