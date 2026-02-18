<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	const { params } = $props();
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	
	const petition = $derived.by(() => {
		return z.createQuery(queries.petition.read({ petitionId: params.petitionId }));
	});
	
	const signatures = $derived.by(() => {
		return z.createQuery(queries.petition.signatures({ petitionId: params.petitionId }));
	});
	
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import PetitionListItem from '../PetitionListItem.svelte';
	import SignatureTable from '$lib/components/widgets/petition/signatures/SignatureTable.svelte';
</script>

<ContentLayout rootLink="/petitions/{params.petitionId}" {header}>
	{#if signatures.details.type === 'complete'}
		<div class="space-y-4">
			<p class="text-muted-foreground">
				Total signatures: {signatures.data?.length ?? 0}
			</p>
			{#if petition.data}
				<SignatureTable 
					signatures={signatures.data ?? []}
					petition={petition.data}
					queryIsCompleted={signatures.details.type === 'complete'}
				/>
			{/if}
		</div>
	{:else}
		<Skeleton class="h-48 w-full" />
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<div>
			{#if petition.data && petition.data.title}
				<PetitionListItem petition={petition.data} />
				<span class="text-muted-foreground ml-2">- Signatures</span>
			{:else}
				<Skeleton class="h-10 w-32 rounded-lg" />
			{/if}
		</div>
	</div>
{/snippet}
