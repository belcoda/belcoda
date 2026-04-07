<script lang="ts">
	import { type PetitionListFilter } from '$lib/zero/query/petition/list';
	let { filter = $bindable() }: { filter: PetitionListFilter } = $props();

	import DisplayTeamFilter from '$lib/components/widgets/person/filter/display/DisplayTeamFilter.svelte';
	import DisplayTagFilter from '$lib/components/widgets/person/filter/display/DisplayTagFilter.svelte';
	import DisplayPetitionStatusFilter from '$lib/components/widgets/person/filter/display/DisplayPetitionStatusFilter.svelte';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import PetitionFilterControls from '$lib/components/layouts/app/sidebars/petitions/filter/PetitionFilterControl.svelte';
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
		<PetitionFilterControls {trigger} bind:filter />
	</InputGroup.Addon>
</InputGroup.Root>

<div class="-mt-1.5 mb-2 flex flex-wrap items-center gap-2">
	{#if filter.teamId}
		<DisplayTeamFilter teamId={filter.teamId} onRemove={() => (filter.teamId = null)} />
	{/if}
	{#if filter.tagId}
		<DisplayTagFilter tagId={filter.tagId} onRemove={() => (filter.tagId = null)} />
	{/if}
	{#if filter.status}
		<DisplayPetitionStatusFilter status={filter.status} onRemove={() => (filter.status = null)} />
	{/if}
</div>
