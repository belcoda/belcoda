<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { v7 as uuidv7 } from 'uuid';
	import { useNodes, useEdges } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { cloneFlow } from '$lib/components/flow/cloneFlow';
	import type { Flow } from '$lib/schema/flow/index';

	const nodes = useNodes();
	const edges = useEdges();

	let open = $state(false);
	let cloning = $state(false);

	async function makeACopy() {
		if (cloning) return;
		cloning = true;
		try {
			// Snapshot the live SvelteFlow reactive state before cloning: native
			// structuredClone throws DataCloneError on Svelte proxies, which is why
			// persistFlow (flow_state.svelte.ts) snapshots for the same mutation.
			const currentFlow = $state.snapshot({
				nodes: nodes.current,
				edges: edges.current
			}) as unknown as Flow;
			const clonedFlow = cloneFlow(currentFlow);
			const newId = uuidv7();
			const result = z.mutate(
				mutators.whatsappThread.create({
					input: { flow: clonedFlow },
					metadata: {
						whatsappThreadId: newId,
						organizationId: appState.organizationId
					}
				})
			);
			await result.client;
			const serverResult = await result.server;
			if (serverResult.type === 'error') {
				throw new Error(`${serverResult.error.message} [${serverResult.error.type}]`);
			}
			open = false;
			await goto(`/communications/whatsapp/drafts/${newId}`);
			toast.success(t`WhatsApp thread copied to a new draft`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t`Failed to copy WhatsApp thread`);
		} finally {
			cloning = false;
		}
	}
</script>

<ResponsiveModal
	bind:open
	title={t`Make a copy`}
	description={t`This creates a new draft with a copy of this thread's messages and steps. The copy always starts as an unsent draft.`}
>
	{#snippet trigger()}
		<Button variant="outline" size="sm" data-testid="flow-clone-button">
			<CopyIcon />
			{t`Clone`}
		</Button>
	{/snippet}
	<Button type="button" onclick={makeACopy} disabled={cloning} data-testid="flow-clone-confirm">
		{cloning ? t`Copying…` : t`Make a copy`}
	</Button>
</ResponsiveModal>
