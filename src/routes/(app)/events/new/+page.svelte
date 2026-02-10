<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import EventCreateOrUpdate from '$lib/components/forms/event/EventCreateOrUpdate.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { type CreateEventZero, type UpdateEventZero, createEventZero } from '$lib/schema/event';
	import { parse } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
	import { v7 as uuidv7 } from 'uuid';
	async function onSubmit(data: CreateEventZero | UpdateEventZero) {
		const id = uuidv7();
		const parsed = parse(createEventZero, data); //to also type check the data
		const event = z.mutate(
			mutators.event.create({
				metadata: {
					eventId: id,
					organizationId: appState.organizationId,
					teamId: appState.activeTeamId
				},
				input: parsed
			})
		);
		await event.client;
		await goto(`/events/${id}`);
	}
</script>

<ContentLayout rootLink="/events" {header} {footer}>
	<EventCreateOrUpdate {onSubmit} />
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{t`New event`}</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline">{t`Cancel`}</Button>
		<Button type="submit" form="event-form">{t`Save`}</Button>
	</div>
{/snippet}
