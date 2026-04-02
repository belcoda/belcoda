<script lang="ts">
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	import { type ReadEventZero } from '$lib/schema/event';
	const { event }: { event: ReadEventZero } = $props();
	import { t } from '$lib/index.svelte';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import type { ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	import queries from '$lib/zero/query/index';
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	let filter = $state<ListEventSignupsInput>({
		...getListFilter(appState.organizationId),
		includeIncomplete: false,
		/* svelte-ignore state_referenced_locally */
		eventId: event.id
	});
	const eventSignups = $derived.by(() => {
		return z.createQuery(queries.eventSignup.list(filter));
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
								{t`All signups`}
							{/if}
							{#if filter.status === 'attended'}
								{t`Attended`}
							{/if}
							{#if filter.status === 'noshow'}
								{t`No show`}
							{/if}
							{#if filter.status === 'notattending'}
								{t`Not attending`}
							{/if}
							{#if filter.status === 'signup'}
								{t`Signed up`}
							{/if}
							{#if filter.status === 'incomplete'}
								{t`Incomplete`}
							{/if}
							<ChevronDownIcon /></Button
						>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = undefined)}
							>{t`All signups`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'attended')}
							>{t`Attended`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'noshow')}
							>{t`No show`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'notattending')}
							>{t`Not attending`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'signup')}
							>{t`Signed up`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => (filter.status = 'incomplete')}
							>{t`Incomplete`}</DropdownMenu.CheckboxItem
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

{#snippet addPersonTrigger()}<Button><UserPlusIcon strokeWidth={2.5} /> {t`Add signup`}</Button
	>{/snippet}
