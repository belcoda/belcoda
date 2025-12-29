<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { readEvent } from '$lib/zero/query/event/read';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	const { params } = $props();
	const event = $derived.by(() => {
		return z.createQuery(readEvent(appState.queryContext, { eventId: params.eventId }));
	});
	import EventCreateOrUpdate from '$lib/components/forms/event/EventCreateOrUpdate.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<ContentLayout rootLink="/events" {header} {footer}>
	{#if event.data}
		<EventCreateOrUpdate event={event.data} />
	{:else}
		<Skeleton class="h-48 w-full" />
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Edit event</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline" type="submit" form="event-form">Cancel</Button>
		<Button>Save</Button>
	</div>
{/snippet}
