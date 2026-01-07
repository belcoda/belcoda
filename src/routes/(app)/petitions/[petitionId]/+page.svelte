<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	const { params } = $props();
	import { readPetition } from '$lib/zero/query/petition/read';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	const petition = $derived.by(() => {
		return z.createQuery(readPetition(appState.queryContext, { petitionId: params.petitionId }));
	});
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import PetitionSignatures from '$lib/components/widgets/petition/PetitionSignatures.svelte';
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
</script>

<ContentLayout rootLink="/petitions" {header}>
	{#if petition.details.type === 'complete' && petition.data}
		<PetitionSignatures petition={petition.data} />
	{:else}
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<div>
			{#if petition.data && petition.data.title}
				<div class="flex w-full items-center justify-start gap-3">
					<div class="w-12">
						<Avatar
							src={petition.data.featureImage}
							name1={petition.data.title}
							class="size-12 rounded-lg"
							imageClass="rounded-lg object-cover"
						/>
					</div>
					<div>
						<div class="flex items-center gap-2">
							<div class="text-lg font-medium">{petition.data.title}</div>
							<ColorBadge color={petition.data.published ? 'green' : 'gray'}>
								{petition.data.published ? 'Published' : 'Draft'}
							</ColorBadge>
						</div>
						{#if petition.data.petitionTarget}
							<div class="text-sm text-muted-foreground">
								Target: {petition.data.petitionTarget}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<Skeleton class="h-10 w-20 rounded-lg" />
			{/if}
		</div>
		<div>
			{#if petition.data}
				<!-- TODO: Add petition action button -->
				<!-- <PetitionActionButton petition={petition.data} /> -->
			{:else}
				<Skeleton class="h-10 w-16 rounded-lg" />
			{/if}
		</div>
	</div>
{/snippet}
