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
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import SendTestWhatsApp from '$lib/components/forms/whatsapp/SendTestWhatsApp.svelte';
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
	import type { Flow as WhatsappFlow } from '$lib/schema/flow';
	let showTestWhatsApp = $state(false);
	let latestDraftFlow = $state<WhatsappFlow | null>(null);

	async function persistDraftFlow(flow: WhatsappFlow) {
		latestDraftFlow = flow;
		await z.mutate(
			mutators.whatsappThread.update({
				metadata: {
					whatsappThreadId: params.id,
					organizationId: appState.organizationId
				},
				input: {
					flow
				}
			})
		);
	}
	onDestroy(() => {
		//if (whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data) {
		//if whatsapp thread is EXACTLY deepEqual to the starting state, delete it.
		//}
		console.log('TODO: Destroy thread');
	});
</script>

{#key params.id}
	{#if whatsappThreadQuery?.details.type === 'complete' && whatsappThreadQuery?.data}
		{@const currentFlow = latestDraftFlow ?? whatsappThreadQuery.data.flow}
		<Flow
			backButtonUrl="/communications/whatsapp"
			nodes={whatsappThreadQuery.data.flow.nodes}
			edges={whatsappThreadQuery.data.flow.edges}
			onTest={() => {
				showTestWhatsApp = true;
			}}
			onSave={async ({ nodes, edges }) => {
				console.log('Saving thread', nodes, edges);
				await persistDraftFlow({ nodes, edges });
			}}
			onSend={async ({ nodes, edges }) => {
				// First che
				if (window.confirm(t`Are you sure you want to send this WhatsApp draft?`)) {
					await persistDraftFlow({ nodes, edges });
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
		<Dialog.Root bind:open={showTestWhatsApp}>
			<Dialog.Content class="sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title>{t`Test WhatsApp`}</Dialog.Title>
					<Dialog.Description>
						{t`Send a test message before sending this draft.`}
					</Dialog.Description>
				</Dialog.Header>
				<SendTestWhatsApp
					whatsappThreadId={params.id}
					beforeSend={async () => {
						await persistDraftFlow(currentFlow);
					}}
					onSent={() => {
						showTestWhatsApp = false;
					}}
				/>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
{/key}
