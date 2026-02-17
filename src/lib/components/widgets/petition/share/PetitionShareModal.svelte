<script lang="ts">
	const { petitionId }: { petitionId: string } = $props();
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { t } from '$lib/index.svelte';
	const petition = $derived.by(() => {
		return z.createQuery(queries.petition.read({ petitionId: petitionId }));
	});
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	import EmbedCode from './EmbedCode.svelte';
	import CheckIn from './CheckIn.svelte';
	import SharePetition from './SharePetition.svelte';
</script>

<Tabs.Root value="share">
	<Tabs.List>
		<Tabs.Trigger value="share">{t`Share`}</Tabs.Trigger>
		<Tabs.Trigger value="embed">{t`Embed`}</Tabs.Trigger>
		<Tabs.Trigger value="checkin">{t`Check-in`}</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="share">
		{#if petition.data}
			<SharePetition petition={petition.data} />
		{/if}
	</Tabs.Content>
	<Tabs.Content value="embed">
		{#if petition.data}
			<EmbedCode petition={petition.data} />
		{/if}
	</Tabs.Content>
	<Tabs.Content value="checkin">
		{#if petition.data}
			<CheckIn petition={petition.data} />
		{/if}
	</Tabs.Content>
</Tabs.Root>
