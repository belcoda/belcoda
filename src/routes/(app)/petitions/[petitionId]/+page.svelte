<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	const { params } = $props();
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const petition = $derived.by(() => {
		return z.createQuery(queries.petition.read({ petitionId: params.petitionId }));
	});
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import PetitionSignatures from '$lib/components/widgets/petition/PetitionSignatures.svelte';
	import PetitionActionButton from './PetitionActionButton.svelte';
	import PetitionListItem from './PetitionListItem.svelte';
</script>

<ContentLayout rootLink="/petitions" {header}>
	{#key params.petitionId}
		{#if petition.details.type === 'complete' && petition.data}
			<PetitionSignatures petition={petition.data} />
		{:else}
			<Skeleton class="h-48 w-full" />
			<Skeleton class="h-48 w-full" />
			<Skeleton class="h-48 w-full" />
		{/if}
	{/key}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<div>
			{#if petition.data && petition.data.title}
				<PetitionListItem petition={petition.data} />
			{:else}
				<Skeleton class="h-10 w-20 rounded-lg" />
			{/if}
		</div>
		<div>
			{#if petition.data}
				<PetitionActionButton petition={petition.data} />
			{:else}
				<Skeleton class="h-10 w-16 rounded-lg" />
			{/if}
		</div>
	</div>
{/snippet}
