<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { appState } from '$lib/state.svelte';
	const { params } = $props();
	const event = $derived.by(() => {
		return z.createQuery(queries.event.read({ eventId: params.eventId }));
	});
	import EventCreateOrUpdate from '$lib/components/forms/event/EventCreateOrUpdate.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	import { type UpdateEventZero, updateEventZero, type CreateEventZero } from '$lib/schema/event';
	import { parse } from 'valibot';
	import { goto } from '$app/navigation';

	async function onSubmit(data: CreateEventZero | UpdateEventZero) {
		if (!event.data) return;
		const parsed = parse(updateEventZero, data); //to also type check the data
		const updatedEventMutator = z.mutate.event.update({
			metadata: {
				eventId: event.data.id,
				organizationId: appState.organizationId,
				teamId: appState.activeTeamId
			},
			input: parsed
		});
		await updatedEventMutator.client;
		await goto(`/events/${event.data.id}`);
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
