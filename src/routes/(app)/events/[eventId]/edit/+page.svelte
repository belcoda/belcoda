<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import queries from '$lib/zero/query/index';
	import { appState } from '$lib/state.svelte';
	const { params } = $props();
	const event = $derived.by(() => {
		return z.createQuery(queries.event.read({ eventId: params.eventId }));
	});
	import EventCreateOrUpdate from '$lib/components/forms/event/EventCreateOrUpdate.svelte';
	import EventCreatedModal from '$lib/components/widgets/event/EventCreatedModal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	import { type UpdateEventZero, updateEventZero, type CreateEventZero } from '$lib/schema/event';
	import type { ReadEventZero } from '$lib/schema/event';
	import type { ReadOrganizationZero } from '$lib/schema/organization';
	import { parse } from 'valibot';
	import { goto } from '$app/navigation';

	let showModal = $state(false);
	let updatedEvent = $state<ReadEventZero | null>(null);

	const organization = $derived(
		appState.activeOrganization.data as ReadOrganizationZero | undefined
	);

	async function onSubmit(data: CreateEventZero | UpdateEventZero) {
		if (!event.data) return;
		const parsed = parse(updateEventZero, data); //to also type check the data
		const updatedEventMutator = z.mutate(
			mutators.event.update({
				metadata: {
					eventId: event.data.id,
					organizationId: appState.organizationId,
					teamId: appState.activeTeamId
				},
				input: parsed
			})
		);
		await updatedEventMutator.client;
		// Show modal with updated event data
		updatedEvent = { ...event.data, ...parsed } as ReadEventZero;
		showModal = true;
	}

	function handleModalClose() {
		if (updatedEvent) {
			goto(`/events/${updatedEvent.id}`);
		}
	}
</script>

<ContentLayout rootLink="/events" {header} {footer}>
	{#if event.data}
		<EventCreateOrUpdate event={event.data} {onSubmit} />
	{:else}
		<Skeleton class="h-48 w-full" />
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{t`Edit event`}</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline">{t`Cancel`}</Button>
		<Button type="submit" form="event-form">{t`Save`}</Button>
	</div>
{/snippet}

{#if updatedEvent && organization}
	<EventCreatedModal
		event={updatedEvent}
		{organization}
		mode="edit"
		bind:open={showModal}
		onOpenChange={(open) => {
			if (!open) handleModalClose();
		}}
	/>
{/if}
