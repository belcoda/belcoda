<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	const { params } = $props();
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const event = $derived.by(() => {
		return z.createQuery(queries.event.read({ eventId: params.eventId }));
	});
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import RenderEventDetails from '$lib/components/layouts/app/sidebars/events/RenderEventDetails.svelte';
	import EventSignups from '$lib/components/widgets/event/EventSignups.svelte';
	import EventActionButton from './EventActionButton.svelte';
</script>

<ContentLayout rootLink="/events" {header}>
	{#if event.details.type === 'complete' && event.data}
		<EventSignups event={event.data} />
	{:else}
		<!-- TODO: Add a loading state -->
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<div>
			{#if event.data && event.data.title}
				<div class="flex w-full items-center justify-start gap-3">
					<div class="w-12">
						<Avatar
							src={event.data.featureImage}
							name1={event.data.title}
							class="size-12 rounded-lg"
							imageClass="rounded-lg object-cover"
						/>
					</div>
					<div>
						<div class="text-lg font-medium">{event.data.title}</div>
						<RenderEventDetails event={event.data} />
					</div>
				</div>
			{:else}
				<Skeleton class="h-10 w-20 rounded-lg" />
			{/if}
		</div>
		<div>
			{#if event.data}
				<EventActionButton event={event.data} />
			{:else}
				<Skeleton class="h-10 w-16 rounded-lg" />
			{/if}
		</div>
	</div>
{/snippet}
