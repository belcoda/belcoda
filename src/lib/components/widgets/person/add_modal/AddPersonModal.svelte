<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { type Snippet } from 'svelte';
	import UserPenIcon from '@lucide/svelte/icons/user-pen';
	import NewPersonForm from '$lib/components/widgets/person/add_modal/NewPersonForm.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	type Props = {
		trigger: Snippet;
		personIdsToExclude: string[];
		onSelected: (personIds: string[]) => void;
	};
	import { cn } from '$lib/utils.js';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	let { trigger, personIdsToExclude = [], onSelected }: Props = $props();
	import { appState, getListFilter } from '$lib/state.svelte';
	let filter = $state({
		...getListFilter(appState.organizationId),
		tagId: null,
		signupEventId: null,
		mostRecentActivity: null,
		/* svelte-ignore state_referenced_locally */
		personIdsToExclude: personIdsToExclude
	});
	import { Debounced } from 'runed';
	let debouncedFilter = new Debounced(() => filter, 1000);
	const personList = $derived.by(() => z.createQuery(queries.person.list(debouncedFilter.current)));
	import PersonFilter from '$lib/components/widgets/person/filter/Filter.svelte';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { type ReadPersonZero } from '$lib/schema/person';
	import { t } from '$lib/index.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	let selectedPersonIds = $state<string[]>([]);
	let selectedPeople = $derived.by(() =>
		z.createQuery(queries.person.listByIds({ ids: selectedPersonIds }))
	);
	let orderedPeople = $derived.by(() => {
		if (!selectedPeople.data) {
			return [];
		}
		let array: ReadPersonZero[] = [];
		selectedPersonIds.forEach((id) => {
			const person = selectedPeople.data.find((p: ReadPersonZero) => p.id === id);
			if (person) {
				array.push(person);
			}
		});
		return array;
	});
	let isOpen = $state(false);
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	let modalMode = $state<'list' | 'create'>('list');
</script>

<ResponsiveModal
	title="Add Person"
	description="Add a new person to the community"
	{trigger}
	bind:open={isOpen}
>
	{#if modalMode === 'list'}
		<PersonFilter bind:filter />
		<ScrollArea
			class={cn(
				'-mt-4 h-[200px] w-full rounded-md',
				personList.details.type === 'complete' && (!personList.data || personList.data.length === 0)
					? 'border-none'
					: 'border'
			)}
		>
			{#if personList.data && personList.data.length > 0}
				{#each personList.data as person}
					{@render personItem(person)}
				{/each}
			{/if}
			{#if personList.details.type === 'error'}
				<div class="py-4 text-center text-muted-foreground">Error loading people</div>
			{:else if personList.details.type === 'unknown'}
				{@render personSkeleton()}
			{:else if personList.details.type === 'complete' && (!personList.data || personList.data.length === 0)}
				{@render createPerson()}
			{/if}
		</ScrollArea>
		{#if selectedPeople.data && selectedPeople.data.length > 0}
			<div class="mt-2 -mb-1 font-medium">{t`Selected`} ({selectedPeople.data.length})</div>
			<ScrollArea class="h-[150px] w-full rounded-md border">
				{#each orderedPeople as person (person.id)}
					{@render selectedPersonItem(person)}
				{/each}
			</ScrollArea>
		{/if}
		{@render listModalFooter()}
	{:else if modalMode === 'create'}
		<NewPersonForm
			bind:modalMode
			onCreated={async (newPersonId) => {
				selectedPersonIds = [newPersonId, ...selectedPersonIds];
				modalMode = 'list';
				filter.searchString = '';
			}}
		/>
	{/if}
</ResponsiveModal>

{#snippet listModalFooter()}
	<div class="flex items-center justify-end gap-2">
		<Button variant="outline" onclick={() => (isOpen = false)}>Close</Button>
		<Button
			disabled={selectedPersonIds.length === 0}
			onclick={() => {
				onSelected(selectedPersonIds);
				isOpen = false;
			}}
			>Add to event ({selectedPersonIds.length})
		</Button>
	</div>
{/snippet}

{#snippet personItem(person: ReadPersonZero)}
	<div class="border-b border-b-accent/70 px-2 py-1.5 last:border-b-0 hover:bg-accent/70">
		<label for={`person-${person.id}`} class="flex items-center gap-2">
			<Checkbox
				class="ms-2.5"
				checked={selectedPersonIds.includes(person.id)}
				id={`person-${person.id}`}
				onCheckedChange={(checked) => {
					if (checked) {
						selectedPersonIds = [person.id, ...selectedPersonIds];
					} else {
						selectedPersonIds = selectedPersonIds.filter((p) => p !== person.id);
					}
				}}
			/>
			{@render renderPersonItem(person)}
		</label>
	</div>
{/snippet}

{#snippet selectedPersonItem(person: ReadPersonZero)}
	<div
		class="flex items-center justify-between gap-2 border-b border-b-accent/70 py-1.5 ps-4 pe-2 last:border-b-0 hover:bg-accent/70"
	>
		{@render renderPersonItem(person)}
		<Button
			variant="ghost"
			class="text-muted-foreground"
			size="sm"
			onclick={() => (selectedPersonIds = selectedPersonIds.filter((p) => p !== person.id))}
		>
			<XIcon />
		</Button>
	</div>
{/snippet}

{#snippet renderPersonItem(person: ReadPersonZero)}
	<div class="flex grow items-center gap-2">
		<Avatar
			src={person.profilePicture}
			class="size-6"
			name1={person.givenName || person.familyName || person.emailAddress || ''}
			name2={person.familyName}
		/>
		<div class="flex flex-col">
			<div class="text-sm font-medium">{person.givenName} {person.familyName}</div>
			{#if person.emailAddress || person.phoneNumber}
				<div class="line-clamp-1 max-w-full text-xs text-muted-foreground">
					{person.emailAddress}
					{#if person.phoneNumber && person.emailAddress}{` • `}{/if}
					{person.phoneNumber}
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet personSkeleton()}
	<div class="flex items-center space-x-4">
		<Skeleton class="size-12 rounded-full" />
		<div class="space-y-2">
			<Skeleton class="h-4 w-[250px]" />
			<Skeleton class="h-4 w-[200px]" />
		</div>
	</div>
{/snippet}

{#snippet createPerson()}
	<div class="flex h-full flex-col items-center justify-center gap-2">
		<div class="flex size-10 items-center justify-center rounded-lg bg-muted">
			<UserPenIcon class="size-6 text-muted-foreground" />
		</div>
		<div class="text-base font-medium">No people found</div>
		<div class="text-sm text-muted-foreground">Create new person?</div>
		<div class="mt-2">
			<Button onclick={() => (modalMode = 'create')}>Create person</Button>
		</div>
	</div>
{/snippet}
