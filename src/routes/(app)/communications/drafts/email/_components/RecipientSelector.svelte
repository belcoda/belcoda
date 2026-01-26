<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listPersons } from '$lib/zero/query/person/list';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import type { FilterGroupType } from '$lib/schema/filter/types';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Users from '@lucide/svelte/icons/users';

	let {
		recipients = $bindable(),
		open = $bindable(false)
	}: {
		recipients: FilterGroupType;
		open: boolean;
	} = $props();

	let searchString = $state('');

	let personFilter = $state({
		...getListFilter(appState.organizationId),
		searchString: null as string | null,
		pageSize: 20
	});

	const personsQuery = $derived.by(() =>
		z.createQuery(listPersons(appState.queryContext, personFilter))
	);

	const persons = $derived(personsQuery.data ?? []);

	function handleSearch(e: Event) {
		const target = e.target as HTMLInputElement;
		searchString = target.value;
		personFilter.searchString = target.value || null;
	}

	function addPersonFilter(
		personId: string,
		givenName: string | null,
		familyName: string | null,
		profilePicture: string | null
	) {
		const personFilter = {
			type: 'personId' as const,
			personId,
			givenName,
			familyName,
			profilePicture
		};

		const existingIndex = recipients.filters.findIndex(
			(f) => f.type === 'personId' && f.personId === personId
		);

		if (existingIndex === -1) {
			recipients.filters = [...recipients.filters, personFilter];
		}
	}

	function removePersonFilter(personId: string) {
		recipients.filters = recipients.filters.filter(
			(f) => !(f.type === 'personId' && f.personId === personId)
		);
	}

	const selectedPersonIds = $derived(
		new Set(
			recipients.filters
				.filter((f) => f.type === 'personId')
				.map((f) => (f.type === 'personId' ? f.personId : ''))
		)
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Select Recipients</Dialog.Title>
			<Dialog.Description>Search and select people to receive this email</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="search">Search People</Label>
				<div class="relative">
					<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="search"
						type="text"
						placeholder="Search by name, email, or phone..."
						class="pl-9"
						value={searchString}
						oninput={handleSearch}
					/>
				</div>
			</div>

			{#if selectedPersonIds.size > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-sm">Selected ({selectedPersonIds.size})</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#each recipients.filters.filter((f) => f.type === 'personId') as filter}
							{#if filter.type === 'personId'}
								<div class="flex items-center justify-between rounded-lg border p-2">
									<div class="flex items-center gap-2">
										<Avatar
											class="size-8"
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
										size="sm"
										onclick={() => removePersonFilter(filter.personId)}
									>
										Remove
									</Button>
								</div>
							{/if}
						{/each}
					</Card.Content>
				</Card.Root>
			{/if}

			<div class="max-h-[400px] space-y-2 overflow-y-auto">
				{#if persons.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<Users class="text-muted-foreground mb-4 size-12" />
						<p class="text-muted-foreground text-sm">
							{searchString ? 'No people found' : 'Start typing to search for people'}
						</p>
					</div>
				{:else}
					{#each persons as person}
						{@const isSelected = selectedPersonIds.has(person.id)}
						<button
							type="button"
							class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted"
							class:bg-muted={isSelected}
							onclick={() => {
								if (isSelected) {
									removePersonFilter(person.id);
								} else {
									addPersonFilter(
										person.id,
										person.givenName,
										person.familyName,
										person.profilePicture
									);
								}
							}}
						>
							<div class="flex items-center gap-3">
								<Avatar
									class="size-10"
									name1={person.givenName || person.emailAddress || ''}
									name2={person.familyName}
									src={person.profilePicture ?? undefined}
								/>
								<div>
									<div class="font-medium">
										{person.givenName || ''}
										{person.familyName || ''}
									</div>
									<div class="text-muted-foreground text-sm">
										{person.emailAddress || person.phoneNumber || ''}
									</div>
								</div>
							</div>
							<div class="text-sm">
								{#if isSelected}
									<span class="text-primary font-medium">Selected</span>
								{:else}
									<span class="text-muted-foreground">Select</span>
								{/if}
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={() => (open = false)}>Done ({selectedPersonIds.size} selected)</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
