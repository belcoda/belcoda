<script lang="ts">
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	import { type ReadEventZero } from '$lib/schema/event';
	const { event }: { event: ReadEventZero } = $props();
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listEventSignups, type ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	let filter: ListEventSignupsInput = $state({
		...getListFilter(appState.organizationId),
		eventId: event.id
	});
	const eventSignups = $derived.by(() => {
		return z.createQuery(listEventSignups(appState.queryContext, filter));
	});
	let selectedEventSignups = $state<ReadEventSignupZeroWithPerson[]>([]);

	import { handleAddPerson } from './signups/actions';

	import SignupTable from './signups/SignupTable.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Card from '$lib/components/ui/card/index.js';
	import PersonFilter from '$lib/components/widgets/person/filter/Filter.svelte';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-start justify-between gap-2 font-normal">
			<div class="grow space-y-3">
				<PersonFilter bind:filter hideActivityFilter={true} />
			</div>
			<div class="flex items-center gap-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline" size="sm">
							{#if !filter.status}
								All signups
							{/if}
							{#if filter.status === 'attended'}
								Attended
							{/if}
							{#if filter.status === 'noshow'}
								No show
							{/if}
							{#if filter.status === 'notattending'}
								Not attending
							{/if}
							{#if filter.status === 'signup'}
								Signed up
							{/if}
							<ChevronDownIcon /></Button
						>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = undefined)}
							>All signups</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'attended')}
							>Attended</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'noshow')}
							>No show</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'notattending')}
							>Not attending</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'signup')}
							>Signed up</DropdownMenu.CheckboxItem
						>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<AddPersonModal
					trigger={addPersonTrigger}
					personIdsToExclude={eventSignups.data.map((signup) => signup.personId)}
					onSelected={(personIds) => {
						handleAddPerson({ eventId: event.id, personIds });
					}}
				/>
			</div>
		</Card.Title>
	</Card.Header>

	<Card.Content>
		<SignupTable
			signups={eventSignups.data as ReadEventSignupZeroWithPerson[]}
			{event}
			bind:selectedSignups={selectedEventSignups}
			queryIsCompleted={eventSignups.details.type === 'complete'}
		/>
	</Card.Content>
</Card.Root>

{#snippet addPersonTrigger()}<Button><UserPlusIcon strokeWidth={2.5} /> Add signup</Button
	>{/snippet}
