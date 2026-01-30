<script lang="ts">
	import { type EventListFilter } from '$lib/zero/query/event/list';
	let { filter = $bindable() }: { filter: EventListFilter } = $props();

	import DisplayTeamFilter from '$lib/components/widgets/person/filter/display/DisplayTeamFilter.svelte';
	import DisplayTagFilter from '$lib/components/widgets/person/filter/display/DisplayTagFilter.svelte';
	import DisplayEventTypeFilter from '$lib/components/widgets/person/filter/display/DisplayEventTypeFilter.svelte';
	import DisplayEventStatusFilter from '$lib/components/widgets/person/filter/display/DisplayEventStatusFilter.svelte';
	import DisplayEventHasSignupsFilter from '$lib/components/widgets/person/filter/display/DisplayEventHasSignupsFilter.svelte';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import FilterControls from '$lib/components/layouts/app/sidebars/events/filter/EventFilterControl.svelte';
	import FilterIcon from '@lucide/svelte/icons/sliders-horizontal';
</script>

{#snippet trigger({ props }: { props: Record<string, unknown> })}
	<InputGroup.Button {...props} variant="ghost" aria-label="Filter" size="icon-xs">
		<FilterIcon />
	</InputGroup.Button>
{/snippet}

<InputGroup.Root class="bg-background">
	<InputGroup.Input placeholder="Search..." bind:value={filter.searchString} />
	<InputGroup.Addon>
		<SearchIcon />
	</InputGroup.Addon>
	<InputGroup.Addon align="inline-end">
		<FilterControls {trigger} bind:filter />
	</InputGroup.Addon>
</InputGroup.Root>

<div class="-mt-1.5 mb-2 flex flex-wrap items-center gap-2">
	{#if filter.teamId}
		<DisplayTeamFilter teamId={filter.teamId} onRemove={() => (filter.teamId = null)} />
	{/if}
	{#if filter.tagId}
		<DisplayTagFilter tagId={filter.tagId} onRemove={() => (filter.tagId = null)} />
	{/if}
	{#if filter.eventType}
		<DisplayEventTypeFilter
			eventType={filter.eventType}
			onRemove={() => (filter.eventType = null)}
		/>
	{/if}
	{#if filter.hasSignups}
		<DisplayEventHasSignupsFilter onRemove={() => (filter.hasSignups = false)} />
	{/if}
	{#if filter.status}
		<DisplayEventStatusFilter status={filter.status} onRemove={() => (filter.status = null)} />
	{/if}
</div>
