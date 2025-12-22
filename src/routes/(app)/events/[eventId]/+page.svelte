<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	const { params } = $props();
	import { readEvent } from '$lib/zero/query/event/read';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { type ReadEventZero } from '$lib/schema/event';
	const event = $derived.by(() => {
		return z.createQuery(readEvent(appState.queryContext, { eventId: params.eventId }));
	});
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import RenderEventDetails from '$lib/components/layouts/app/sidebars/events/RenderEventDetails.svelte';
	import EventSignups from '$lib/components/widgets/event/EventSignups.svelte';
</script>

<ContentLayout rootLink="/events" {header}>
	{#if event.details.type === 'complete' && event.data}
		<EventSignups eventId={event.data.id} />
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
			<Button variant="outline"><EllipsisIcon class="size-5" /></Button>
		</div>
	</div>
{/snippet}
