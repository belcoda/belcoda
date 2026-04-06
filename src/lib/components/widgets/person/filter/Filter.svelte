<script lang="ts">
	import { type ListPersonsInput } from '$lib/zero/query/person/list';
	import { t } from '$lib/index.svelte';
	let {
		filter = $bindable(),
		hideActivityFilter = false
	}: { filter: ListPersonsInput; hideActivityFilter?: boolean } = $props();

	import DisplayTeamFilter from '$lib/components/widgets/person/filter/display/DisplayTeamFilter.svelte';
	import DisplayTagFilter from '$lib/components/widgets/person/filter/display/DisplayTagFilter.svelte';
	import DisplayEventFilter from '$lib/components/widgets/person/filter/display/DisplayEventFilter.svelte';
	import DisplayActivityFilter from '$lib/components/widgets/person/filter/display/DisplayActivityFilter.svelte';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import FilterControls from '$lib/components/widgets/person/filter/FilterControls.svelte';
	import FilterIcon from '@lucide/svelte/icons/sliders-horizontal';
</script>

{#snippet trigger({ props }: { props: Record<string, unknown> })}
	<InputGroup.Button {...props} variant="ghost" aria-label={t`Filter`} size="icon-xs">
		<FilterIcon />
	</InputGroup.Button>
{/snippet}

<InputGroup.Root class="bg-background">
	<InputGroup.Input
		data-testid="community-person-search"
		placeholder={t`Search...`}
		bind:value={filter.searchString}
	/>
	<InputGroup.Addon>
		<SearchIcon />
	</InputGroup.Addon>
	<InputGroup.Addon align="inline-end">
		<FilterControls {trigger} bind:filter {hideActivityFilter} />
	</InputGroup.Addon>
</InputGroup.Root>

<div class="-mt-1.5 mb-2 flex flex-wrap items-center gap-2">
	{#if filter.teamId}
		<DisplayTeamFilter teamId={filter.teamId} onRemove={() => (filter.teamId = null)} />
	{/if}
	{#if filter.tagId}
		<DisplayTagFilter tagId={filter.tagId} onRemove={() => (filter.tagId = null)} />
	{/if}
	{#if filter.signupEventId}
		<DisplayEventFilter
			eventId={filter.signupEventId}
			onRemove={() => (filter.signupEventId = null)}
		/>
	{/if}
	{#if filter.mostRecentActivity}
		<DisplayActivityFilter
			mostRecentActivity={filter.mostRecentActivity}
			onRemove={() => (filter.mostRecentActivity = null)}
		/>
	{/if}
</div>
