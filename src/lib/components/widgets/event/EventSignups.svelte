<script lang="ts">
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	import { type ReadEventZero } from '$lib/schema/event';
	const { event }: { event: ReadEventZero } = $props();
	import { t, locale } from '$lib/index.svelte';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import type { ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	import type { ListPersonsInput } from '$lib/zero/query/person/list';
	import queries from '$lib/zero/query/index';
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodeEventSignupListCursor } from '$lib/utils/event-signup/cursor';
	import { IsInViewport, watch } from 'runed';
	import { formatNumber } from '$lib/utils/number';
	import { onDestroy } from 'svelte';
	import {
		registerEventSignupsListPaginationReset,
		resetEventSignupsListPagination,
		unregisterEventSignupsListPaginationReset
	} from './signups/event-signups-list-pagination';

	const pageSize = 25;
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));

	let filter = $state<
		ListEventSignupsInput & Pick<ListPersonsInput, 'favouriteMode' | 'includeFavourites'>
	>({
		...getListFilter(appState.organizationId),
		favouriteMode: 'all',
		includeFavourites: false,
		includeIncomplete: false,
		/* svelte-ignore state_referenced_locally */
		eventId: event.id
	});

	const paginatedSignups = new PaginatedZeroList<
		ListEventSignupsInput,
		ReadEventSignupZeroWithPerson
	>({
		getBaseFilter: () => filter,
		encodeCursor: encodeSignupCursor,
		pageSize
	});

	registerEventSignupsListPaginationReset(() => paginatedSignups.reset());
	onDestroy(unregisterEventSignupsListPaginationReset);

	/** Keeps `includeIncomplete` aligned with `list.ts` whereClause: incomplete rows are excluded unless this flag is true. */
	function setSignupStatusFilter(status: ListEventSignupsInput['status']) {
		filter.status = status;
		filter.includeIncomplete = status === 'incomplete';
	}

	const eventSignups = $derived.by(() => {
		return z.createQuery(queries.eventSignup.list(paginatedSignups.pageFilter));
	});

	watch(
		() => eventSignups.data,
		(data) => {
			paginatedSignups.handlePage(data as ReadEventSignupZeroWithPerson[] | undefined);
		}
	);

	watch(
		() =>
			[
				sentinelIsInViewport.current,
				paginatedSignups.hasMore,
				paginatedSignups.items.length
			] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedSignups.loadMore();
			}
		}
	);

	function encodeSignupCursor(signup: ReadEventSignupZeroWithPerson) {
		return encodeEventSignupListCursor({
			createdAt: signup.createdAt,
			id: signup.id
		});
	}

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
						<DropdownMenu.CheckboxItem onclick={() => setSignupStatusFilter(undefined)}
							>{t`All signups`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => setSignupStatusFilter('attended')}
							>{t`Attended`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => setSignupStatusFilter('noshow')}
							>{t`No show`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => setSignupStatusFilter('notattending')}
							>{t`Not attending`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => setSignupStatusFilter('signup')}
							>{t`Signed up`}</DropdownMenu.CheckboxItem
						>
						<DropdownMenu.CheckboxItem onclick={() => setSignupStatusFilter('incomplete')}
							>{t`Incomplete`}</DropdownMenu.CheckboxItem
						>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<AddPersonModal
					trigger={addPersonTrigger}
					personIdsToExclude={paginatedSignups.items.map((signup) => signup.personId)}
					onSelected={(personIds) => {
						handleAddPerson({ eventId: event.id, personIds });
						resetEventSignupsListPagination();
					}}
				/>
			</div>
		</Card.Title>
	</Card.Header>

	<Card.Content>
		<div data-testid="event-signups-list">
			<SignupTable
				signups={paginatedSignups.items}
				{event}
				bind:selectedSignups={selectedEventSignups}
				queryIsCompleted={eventSignups.details.type === 'complete'}
			/>
			{#if paginatedSignups.hasMore}
				<div bind:this={sentinel} class="h-1" data-testid="event-signups-scroll-sentinel"></div>
			{/if}
			{#if paginatedSignups.items.length > 0}
				<div class="pt-2 text-center text-xs text-muted-foreground">
					{t`${formatNumber(paginatedSignups.items.length, locale.current)} shown`}
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

{#snippet addPersonTrigger()}<Button><UserPlusIcon strokeWidth={2.5} /> {t`Add signup`}</Button
	>{/snippet}
