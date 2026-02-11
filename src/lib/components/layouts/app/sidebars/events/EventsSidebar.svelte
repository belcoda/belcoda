<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import { getLocalTimeZone } from '@internationalized/date';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
	import EventCalendar from '$lib/components/layouts/app/sidebars/events/calendar/EventCalendar.svelte';
	import EventFilter from '$lib/components/layouts/app/sidebars/events/filter/EventFilter.svelte';
	import { type DateRange } from 'bits-ui';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import type { EventListFilter } from '$lib/zero/query/event/list';
	import {
		getMonthBoundFromCalendarDate,
		getTimestampFromCalendarDate,
		getTodayCalendarDate
	} from '$lib/utils/date';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import RenderEvent from '$lib/components/layouts/app/sidebars/events/RenderEvent.svelte';
	import { t } from '$lib/index.svelte';
	let placeholder = $state(getTodayCalendarDate(getLocalTimeZone()));
	let value = $state<DateRange>({
		start: undefined,
		end: undefined
	});
	const dateRange = $derived({
		start: value.start
			? getTimestampFromCalendarDate(
					{ year: value.start.year, month: value.start.month, day: value.start.day },
					getLocalTimeZone(),
					'start'
				)
			: getTimestampFromCalendarDate(
					getMonthBoundFromCalendarDate({
						year: placeholder.year,
						month: placeholder.month,
						day: placeholder.day
					}).start,
					getLocalTimeZone(),
					'start'
				),
		end: value.end
			? getTimestampFromCalendarDate(
					{ year: value.end.year, month: value.end.month, day: value.end.day },
					getLocalTimeZone(),
					'end'
				)
			: getTimestampFromCalendarDate(
					getMonthBoundFromCalendarDate({
						year: placeholder.year,
						month: placeholder.month,
						day: placeholder.day
					}).end,
					getLocalTimeZone(),
					'end'
				)
	});

	let eventListFilter: EventListFilter = $state({
		...getListFilter(appState.organizationId),
		tagId: null,
		eventType: null,
		hasSignups: false,
		status: null
	});

	const eventList = $derived.by(() =>
		z.createQuery(queries.event.list({ ...eventListFilter, dateRange: dateRange }))
	);
</script>

<Sidebar.Root
	collapsible={!isMobile.current ? 'icon' : 'none'}
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
>
	{#if !isMobile.current}
		<DesktopNavSidebar />
	{/if}
	<Sidebar.Root collapsible="none" class="flex w-full flex-1">
		<Sidebar.Header class="gap-3.5 border-b p-4">
			<div class="flex w-full items-center justify-between">
				<div class="text-2xl font-bold text-foreground">{t`Events`}</div>
				<Button href="/events" variant="outline"><CalendarPlusIcon class="size-5" /></Button>
			</div>
			<EventCalendar
				bind:value
				bind:placeholder
				onPlaceholderChange={(placeholder) => {
					value = getMonthBoundFromCalendarDate({
						year: placeholder.year,
						month: placeholder.month,
						day: placeholder.day
					});
				}}
				onValueChange={(value) => {
					if (value.start && value.end) {
						eventListFilter.dateRange = {
							start: getTimestampFromCalendarDate(
								{ year: value.start.year, month: value.start.month, day: value.start.day },
								getLocalTimeZone(),
								'start'
							),
							end: getTimestampFromCalendarDate(
								{ year: value.end.year, month: value.end.month, day: value.end.day },
								getLocalTimeZone(),
								'end'
							)
						};
					} else {
						eventListFilter.dateRange = null;
					}
				}}
			/>
			<EventFilter bind:filter={eventListFilter} />
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group class="p-0">
				<Sidebar.GroupContent class="h-full p-0 ">
					<div class="flex flex-col">
						{#if eventList.data && eventList.data.length > 0}
							{#each eventList.data as event (event.id)}
								<RenderEvent {event} />
							{/each}
						{/if}
						{#if eventList.details.type === 'unknown'}
							{@render eventItemSkeleton()}
							{@render eventItemSkeleton()}
							{@render eventItemSkeleton()}
						{:else if eventList.details.type === 'error'}
							<div>Error loading events</div>
						{/if}
						{#if eventList.details.type === 'complete' && (!eventList.data || eventList.data.length === 0)}
							<Empty.Root>
								<Empty.Header>
									<Empty.Media variant="icon">
										<CalendarPlusIcon />
									</Empty.Media>
									<Empty.Title>{t`No events found`}</Empty.Title>
									<Empty.Description>
										{t`No events found. Create a new event to get started.`}
									</Empty.Description>
									<Empty.Content>
										<Button href="/events/new">{t`Create Event`}</Button>
									</Empty.Content>
								</Empty.Header>
							</Empty.Root>
						{/if}
					</div>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>

{#snippet eventItemSkeleton()}
	<div
		class="flex w-full items-center justify-start gap-3 border-b px-2 py-3 last:border-b-0 hover:bg-muted"
	>
		<Skeleton class="size-12 rounded-lg" />
		<div class="grow">
			<Skeleton class="h-4 w-full" />
			<Skeleton class="h-4 w-full" />
		</div>
	</div>
{/snippet}
