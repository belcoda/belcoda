<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import PetitionCreateOrUpdate from '$lib/components/forms/petition/PetitionCreateOrUpdate.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		type CreatePetitionZero,
		type UpdatePetitionZero,
		createPetitionZero
	} from '$lib/schema/petition/petition';
	import { parse } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
	import { v7 as uuidv7 } from 'uuid';

	async function onSubmit(data: CreatePetitionZero | UpdatePetitionZero) {
		const id = uuidv7();
		const parsed = parse(createPetitionZero, data);
		const petition = z.mutate.petition.create({
			metadata: {
				petitionId: id,
				organizationId: appState.organizationId,
				teamId: appState.activeTeamId
			},
			input: parsed
		});
		await petition.client;
		await goto(`/petitions/${id}`);
	}
</script>

<ContentLayout rootLink="/petitions" {header} {footer}>
	<PetitionCreateOrUpdate {onSubmit} />
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">New petition</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline" href="/petitions">Cancel</Button>
		<Button type="submit" form="petition-form">Save</Button>
	</div>
{/snippet}
