<script lang="ts">
	// Eager create: mint the flow + its document, then redirect into the editor. Based on the legacy
	// /communications/whatsapp/drafts/new route, adapted to the flow.create mutator (which creates the
	// flow and its backing flow_document atomically from client-pre-generated ids).
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { v7 as uuidv7 } from 'uuid';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib/index.svelte';
	import { toast } from 'svelte-sonner';

	onMount(async () => {
		const flowId = uuidv7();
		const flowDocumentId = uuidv7();
		try {
			const result = z.mutate(
				mutators.flow.create({
					input: { name: 'New flow', description: null, teamId: null },
					metadata: { organizationId: appState.organizationId, flowId, flowDocumentId }
				})
			);
			const serverResult = await result.server;
			if (serverResult.type === 'error') {
				throw new Error(serverResult.error.message);
			}
			await goto(resolve(`/flow/${flowId}`));
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : t`Could not create flow`);
			await goto(resolve('/flow'));
		}
	});
</script>

<div class="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
	{t`Creating flow…`}
</div>
