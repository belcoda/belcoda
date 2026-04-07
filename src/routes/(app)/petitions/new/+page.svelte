<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import PetitionCreateOrUpdate from '$lib/components/forms/petition/PetitionCreateOrUpdate.svelte';
	import PetitionCreatedModal from '$lib/components/widgets/petition/PetitionCreatedModal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		type CreatePetitionZero,
		type UpdatePetitionZero,
		type ReadPetitionZero,
		createPetitionZero,
		readPetitionZero
	} from '$lib/schema/petition/petition';
	import { parse } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
	import { v7 as uuidv7 } from 'uuid';

	let createdPetition = $state<ReadPetitionZero | null>(null);
	let modalOpen = $state(false);
	const petitionTeamId = $derived.by(() => {
		if (appState.isAdminOrOwner) {
			return null; // admin or owner can create a petition for any/no team
		} else {
			return appState.activeTeamId || appState.myTeams.data?.[0]?.id || null; // member can create a petition for their active team or the first team they are a member of
		}
	});
	async function onSubmit(data: CreatePetitionZero | UpdatePetitionZero) {
		const id = uuidv7();
		const parsed = parse(createPetitionZero, data);
		const petition = z.mutate(
			mutators.petition.create({
				metadata: {
					petitionId: id,
					organizationId: appState.organizationId
				},
				input: {
					...parsed,
					teamId: petitionTeamId || undefined
				}
			})
		);
		await petition.client;
		createdPetition = parse(readPetitionZero, {
			id,
			...parsed,
			published: false,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			organizationId: appState.organizationId,
			teamId: appState.activeTeamId,
			deletedAt: null,
			archivedAt: null
		});
		modalOpen = true;
	}

	function handleModalClose() {
		if (createdPetition) {
			goto(`/petitions/${createdPetition.id}`);
		}
	}
</script>

<ContentLayout rootLink="/petitions" {header} {footer}>
	<PetitionCreateOrUpdate {onSubmit} />
</ContentLayout>

{#if createdPetition}
	<PetitionCreatedModal
		petition={createdPetition}
		mode="create"
		bind:open={modalOpen}
		onOpenChange={(open) => {
			if (!open) handleModalClose();
		}}
	/>
{/if}

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{t`New petition`}</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline" href="/petitions">{t`Cancel`}</Button>
		<Button type="submit" form="petition-form">{t`Save`}</Button>
	</div>
{/snippet}
