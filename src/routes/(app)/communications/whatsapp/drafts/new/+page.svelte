<script lang="ts">
	import { goto } from '$app/navigation';
	import { v7 as uuidv7 } from 'uuid';
	import { onMount } from 'svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { startingNodes } from '$lib/components/flow/nodes/addNode';
	import type { Node, Edge } from '@xyflow/svelte';
	onMount(async () => {
		const id = uuidv7();
		const { nodes: startingNodesList, edges: startingEdgesList } = startingNodes({
			defaultTemplateId: appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
		});
		const promise = z.mutate(
			mutators.whatsappThread.create({
				metadata: {
					whatsappThreadId: id,
					organizationId: appState.organizationId
				},
				input: {
					//ts-ignore there is an issue with node expecting generic types
					flow: { nodes: startingNodesList, edges: startingEdgesList }
				}
			})
		);
		await promise.client;
		await goto(`/communications/whatsapp/drafts/${id}`);
	});
</script>
