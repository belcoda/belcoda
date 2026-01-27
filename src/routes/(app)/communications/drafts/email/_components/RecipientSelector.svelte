<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listPersons } from '$lib/zero/query/person/list';
	import { Button } from '$lib/components/ui/button';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import type { FilterGroupType } from '$lib/schema/filter/types';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { Debounced } from 'runed';

	let {
		recipients = $bindable(),
		onChange
	}: {
		recipients: FilterGroupType;
		onChange?: () => void;
	} = $props();

	let personFilter = $state({
		...getListFilter(appState.organizationId),
		searchString: null as string | null,
		pageSize: 50
	});

	let debouncedFilter = new Debounced(() => personFilter, 500);
	let isSearchFocused = $state(false);

	const personsQuery = $derived.by(() =>
		z.createQuery(listPersons(appState.queryContext, debouncedFilter.current))
	);

	const persons = $derived(personsQuery.data ?? []);

	function togglePerson(
		personId: string,
		givenName: string | null,
		familyName: string | null,
		profilePicture: string | null
	) {
		const existingIndex = recipients.filters.findIndex(
			(f) => f.type === 'personId' && f.personId === personId
		);

		if (existingIndex === -1) {
			const personFilter = {
				type: 'personId' as const,
				personId,
				givenName,
				familyName,
				profilePicture
			};
			recipients = {
				...recipients,
				filters: [...recipients.filters, personFilter]
			};
		} else {
			recipients = {
				...recipients,
				filters: recipients.filters.filter(
					(f) => !(f.type === 'personId' && f.personId === personId)
				)
			};
		}
		onChange?.();
	}

	function removePerson(personId: string) {
		recipients = {
			...recipients,
			filters: recipients.filters.filter((f) => !(f.type === 'personId' && f.personId === personId))
		};
		onChange?.();
	}

	const selectedPersonIds = $derived(
		new Set(
			recipients.filters
				.filter((f) => f.type === 'personId')
				.map((f) => (f.type === 'personId' ? f.personId : ''))
		)
	);

	const selectedPeople = $derived(
		recipients.filters.filter((f) => f.type === 'personId')
	);
</script>

<div class="relative space-y-3">
	<InputGroup.Root class="bg-background">
		<InputGroup.Input
			placeholder="Search people by name, email, or phone..."
			bind:value={personFilter.searchString}
			onfocus={() => (isSearchFocused = true)}
			onblur={() => {
				setTimeout(() => (isSearchFocused = false), 300);
			}}
		/>
		<InputGroup.Addon>
			<SearchIcon />
		</InputGroup.Addon>
	</InputGroup.Root>

	{#if selectedPeople.length > 0}
		<div>
			<div class="mb-2 text-sm font-medium">Selected ({selectedPeople.length})</div>
			<ScrollArea class="max-h-[120px] rounded-md border">
				{#each selectedPeople as filter}
					{#if filter.type === 'personId'}
						<div
							class="flex items-center justify-between gap-2 border-b border-b-accent/70 py-1.5 ps-4 pe-2 last:border-b-0 hover:bg-accent/70"
						>
							<div class="flex grow items-center gap-2">
								<Avatar
									class="size-6"
									name1={filter.givenName ?? ''}
									name2={filter.familyName ?? ''}
									src={filter.profilePicture ?? undefined}
								/>
								<div class="text-sm">
									{filter.givenName ?? ''}
									{filter.familyName ?? ''}
								</div>
							</div>
							<Button
								variant="ghost"
								class="text-muted-foreground"
								size="sm"
								onclick={() => removePerson(filter.personId)}
							>
								<XIcon class="size-4" />
							</Button>
						</div>
					{/if}
				{/each}
			</ScrollArea>
		</div>
	{/if}

	{#if isSearchFocused}
		<ScrollArea
			class="h-[300px] rounded-md border"
			onmousedown={(e) => {
				e.preventDefault();
			}}
		>
			{#if persons.length === 0}
				<div class="flex h-full flex-col items-center justify-center py-8 text-center">
					<SearchIcon class="text-muted-foreground mb-3 size-10" />
					<p class="text-muted-foreground text-sm">
						{personFilter.searchString ? 'No people found' : 'Start typing to search for people'}
					</p>
				</div>
			{:else}
				{#each persons as person}
					{@const isSelected = selectedPersonIds.has(person.id)}
					<button
						type="button"
						class="w-full border-b border-b-accent/70 px-2 py-1.5 text-left last:border-b-0 hover:bg-accent/70"
						onclick={() => {
							togglePerson(person.id, person.givenName, person.familyName, person.profilePicture);
						}}
					>
						<div class="flex items-center gap-2">
							<Checkbox class="ms-2.5 pointer-events-none" checked={isSelected} />
							<div class="flex grow items-center gap-2">
								<Avatar
									class="size-6"
									name1={person.givenName || person.emailAddress || ''}
									name2={person.familyName}
									src={person.profilePicture ?? undefined}
								/>
								<div class="flex flex-col">
									<div class="text-sm font-medium">
										{person.givenName || ''}
										{person.familyName || ''}
									</div>
									{#if person.emailAddress || person.phoneNumber}
										<div class="line-clamp-1 max-w-full text-xs text-muted-foreground">
											{person.emailAddress}
											{#if person.phoneNumber && person.emailAddress}{` • `}{/if}
											{person.phoneNumber}
										</div>
									{/if}
								</div>
							</div>
						</div>
					</button>
				{/each}
			{/if}
		</ScrollArea>
	{/if}
</div>
