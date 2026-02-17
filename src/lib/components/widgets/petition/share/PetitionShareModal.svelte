<script lang="ts">
	const { petitionId }: { petitionId: string } = $props();
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import { t } from '$lib/index.svelte';
	const actionCodes = $derived.by(() => {
		return z.createQuery(
			queries.actionCode.list({
				organizationId: appState.organizationId,
				referenceId: petitionId
			})
		);
	});
	const petition = $derived.by(() => {
		return z.createQuery(queries.petition.read({ petitionId: petitionId }));
	});
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	const actionCodeSigned = $derived.by(() => {
		return actionCodes.data?.find((actionCode) => actionCode.type === 'petition_signed');
	});

	import EmbedCode from './EmbedCode.svelte';
	import SharePetition from './SharePetition.svelte';
</script>

<Tabs.Root value="share">
	<Tabs.List>
		<Tabs.Trigger value="share">{t`Share`}</Tabs.Trigger>
		<Tabs.Trigger value="embed">{t`Embed`}</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="share">
		{#if petition.data && actionCodeSigned}
			<SharePetition petition={petition.data} actionCode={actionCodeSigned} />
		{/if}
	</Tabs.Content>
	<Tabs.Content value="embed">
		{#if petition.data}
			<EmbedCode petition={petition.data} />
		{/if}
	</Tabs.Content>
</Tabs.Root>
