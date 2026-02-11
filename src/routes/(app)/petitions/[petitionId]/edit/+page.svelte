<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	const petition = $derived.by(() => {
		return z.createQuery(queries.petition.read({ petitionId: params.petitionId }));
	});
	import PetitionCreateOrUpdate from '$lib/components/forms/petition/PetitionCreateOrUpdate.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	import {
		type UpdatePetitionZero,
		updatePetitionZero,
		type CreatePetitionZero
	} from '$lib/schema/petition/petition';
	import { parse } from 'valibot';
	import { goto } from '$app/navigation';
	import { appState } from '$lib/state.svelte';

	async function onSubmit(data: CreatePetitionZero | UpdatePetitionZero) {
		if (!petition.data) return;
		const parsed = parse(updatePetitionZero, data);
		const updatedPetitionMutator = z.mutate(
			mutators.petition.update({
				metadata: {
					petitionId: petition.data.id,
					organizationId: appState.organizationId,
					teamId: appState.activeTeamId
				},
				input: parsed
			})
		);
		await updatedPetitionMutator.client;
		await goto(`/petitions/${petition.data.id}`);
	}
</script>

<ContentLayout rootLink="/petitions" {header} {footer}>
	{#if petition.data}
		<PetitionCreateOrUpdate petition={petition.data} {onSubmit} />
	{:else}
		<Skeleton class="h-48 w-full" />
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{t`Edit petition`}</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline" href={`/petitions/${params.petitionId}`}>{t`Cancel`}</Button>
		<Button type="submit" form="petition-form">{t`Save`}</Button>
	</div>
{/snippet}
