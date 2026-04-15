<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import EventCreateOrUpdate from '$lib/components/forms/event/EventCreateOrUpdate.svelte';
	import EventCreatedModal from '$lib/components/widgets/event/EventCreatedModal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		type CreateEventZero,
		type UpdateEventZero,
		createEventZero,
		readEventZero
	} from '$lib/schema/event';
	import { parse } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
	import { v7 as uuidv7 } from 'uuid';
	import type { ReadEventZero } from '$lib/schema/event';
	import type { ReadOrganizationZero } from '$lib/schema/organization';

	let createdEvent = $state<ReadEventZero | null>(null);
	let modalOpen = $state(false);

	const organization = $derived(
		appState.activeOrganization.data as ReadOrganizationZero | undefined
	);

	const eventTeamId = $derived.by(() => {
		if (appState.isAdminOrOwner) {
			return null; // admin or owner can create an event for any/no team
		} else {
			return appState.activeTeamId || appState.myTeams.data?.[0]?.id || null; // member can create an event for their active team or the first team they are a member of
		}
	});

	async function onSubmit(data: CreateEventZero | UpdateEventZero) {
		const id = uuidv7();
		const parsed = parse(createEventZero, data); //to also type check the data
		const event = z.mutate(
			mutators.event.create({
				metadata: {
					eventId: id,
					organizationId: appState.organizationId
				},
				input: { ...parsed, teamId: eventTeamId || undefined }
			})
		);
		await event.client;
		// Fetch the created event data for the modal
		createdEvent = parse(readEventZero, {
			id,
			...parsed,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			organizationId: appState.organizationId,
			teamId: appState.activeTeamId,
			reminderSentAt: null,
			deletedAt: null,
			archivedAt: null,
			cancelledAt: null
		});
		modalOpen = true;
	}

	function handleModalClose() {
		if (createdEvent) {
			goto(`/events/${createdEvent.id}`);
		}
	}
</script>

<ContentLayout rootLink="/events" {header} {footer}>
	<EventCreateOrUpdate {onSubmit} />
</ContentLayout>

{#if createdEvent && organization}
	<EventCreatedModal
		event={createdEvent}
		{organization}
		mode="create"
		bind:open={modalOpen}
		onOpenChange={(open) => {
			if (!open) handleModalClose();
		}}
	/>
{/if}

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{t`New event`}</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline">{t`Cancel`}</Button>
		<Button type="submit" form="event-form" data-testid="event-save-button">{t`Save`}</Button>
	</div>
{/snippet}
