<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { ComponentProps } from 'svelte';

	import { appState, getListFilter } from '$lib/state.svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { RangeCalendar, type DateRange } from 'bits-ui';

	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	let calendarOpen = $state(!isMobile.current);

	import CaretLeft from '@lucide/svelte/icons/chevron-left';
	import CaretRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDownIcon from '@lucide/svelte/icons/chevrons-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevrons-up';
	import { cn } from '$lib/utils.js';

	import type { ReadEventZero } from '$lib/schema/event';

	type Props = {
		placeholder: CalendarDate;
		onValueChange: (value: DateRange) => void;
	} & ComponentProps<typeof RangeCalendar.Root>;
	let {
		value = $bindable(),
		placeholder = $bindable(),
		onValueChange = $bindable()
	}: Props = $props();

	import { type CalendarDate, getLocalTimeZone } from '@internationalized/date';
	import { doesEventStartOnDay, getMonthBounds } from '$lib/utils/date';
	import { z } from '$lib/zero.svelte';
	import { listEvents, type EventListFilter } from '$lib/zero/query/event/list';

	let calendarEventListFilter: EventListFilter = $state({
		...getListFilter(appState.organizationId),
		dateRange: getMonthBounds(getLocalTimeZone(), placeholder),
		tagId: null
	});
	const calendarEventList = $derived.by(() =>
		z.createQuery(listEvents(appState.queryContext, calendarEventListFilter))
	);
	import { watch } from 'runed';
	watch(
		() => placeholder,
		() => {
			const { start, end } = getMonthBounds(getLocalTimeZone(), placeholder);
			calendarEventListFilter.dateRange = {
				start: start,
				end: end
			};
		}
	);

	function isEventOnDay(calendarDate: { year: number; month: number; day: number }) {
		let result = false;
		calendarEventList.data?.forEach((event: ReadEventZero) => {
			if (
				doesEventStartOnDay(
					{ year: calendarDate.year, month: calendarDate.month, day: calendarDate.day },
					event.startsAt,
					event.timezone
				)
			) {
				result = true;
			}
		});
		return result;
	}
</script>

<RangeCalendar.Root
	class="w-full"
	weekdayFormat="short"
	fixedWeeks={true}
	bind:value
	bind:placeholder
	onValueChange={(value) => {
		onValueChange(value);
	}}
>
	{#snippet children({ months, weekdays })}
		<RangeCalendar.Header class="flex w-full items-baseline justify-between">
			<RangeCalendar.PrevButton
				onclick={() => {
					value = {
						start: undefined,
						end: undefined
					};
				}}
				class="rounded-9px bg-background-alt inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted active:scale-[0.98]"
			>
				<CaretLeft class="size-4 text-muted-foreground" />
			</RangeCalendar.PrevButton>
			<div>
				<RangeCalendar.Heading class="text-[15px] font-medium" />
				{#if !calendarOpen}<div class="mt-0 flex justify-center">
						<Button
							class="my-0 mt-1 text-muted-foreground"
							variant="ghost"
							size="icon-sm"
							onclick={() => (calendarOpen = true)}
							><ChevronDownIcon class="size-4" aria-hidden="true" /></Button
						>
					</div>
				{/if}
			</div>
			<RangeCalendar.NextButton
				onclick={() => {
					value = {
						start: undefined,
						end: undefined
					};
				}}
				class="rounded-9px bg-background-alt inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted active:scale-[0.98]"
			>
				<CaretRight class="size-4 text-muted-foreground" />
			</RangeCalendar.NextButton>
		</RangeCalendar.Header>
		{#if calendarOpen}
			<div
				class="flex w-full flex-col space-y-4 pt-4 sm:flex-row sm:space-y-0 sm:space-x-4"
				transition:slide={{ duration: 100, axis: 'y' }}
			>
				{#each months as month (month.value.month)}
					<RangeCalendar.Grid class="w-full border-collapse space-y-1 select-none">
						<RangeCalendar.GridHead>
							<RangeCalendar.GridRow class="mb-1 flex w-full justify-between">
								{#each weekdays as day (day)}
									<RangeCalendar.HeadCell
										class="w-10 rounded-md text-xs font-normal! text-muted-foreground"
									>
										<div>{day.slice(0, 2)}</div>
									</RangeCalendar.HeadCell>
								{/each}
							</RangeCalendar.GridRow>
						</RangeCalendar.GridHead>
						<RangeCalendar.GridBody class="w-full">
							{#each month.weeks as weekDates, i (i)}
								<RangeCalendar.GridRow class="flex justify-between">
									{#each weekDates as date, d (d)}
										<RangeCalendar.Cell
											{date}
											month={month.value}
											class="relative m-0! h-10 w-full p-0! text-center text-sm focus-within:z-20"
										>
											<RangeCalendar.Day
												class={cn(
													`rounded-9px
                           group 
                           relative 
                           inline-flex 
                           h-10 
                           w-full 
                           items-center 
                           justify-center 
                           overflow-visible 
                           rounded-sm 
                           border 
                           border-transparent 
                           bg-transparent 
                           p-0 
                           text-sm 
                           font-normal 
                           whitespace-nowrap 
                           text-foreground 
                           hover:border-foreground 
                           focus-visible:ring-foreground! 
                           data-disabled:pointer-events-none 
                           data-disabled:text-foreground/30 
                           data-highlighted:rounded-none 
                           data-highlighted:bg-muted 
                           data-outside-month:pointer-events-none 
                           data-selected:bg-muted 
                           data-selected:font-medium
                           data-selected:text-foreground 
                           data-selection-end:rounded-lg 
                           data-selection-end:bg-foreground 
                           data-selection-end:font-medium 
                           data-selection-end:text-background 
                           data-selection-start:rounded-lg 
                           data-selection-start:bg-foreground 
                           data-selection-start:font-medium 
                           data-selection-start:text-background 
                           data-selection-start:focus-visible:ring-2 
                           data-selection-start:focus-visible:ring-offset-2! 
                           data-today:font-bold
                           data-unavailable:text-muted-foreground 
                           data-unavailable:line-through 
                           data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:rounded-none
                           data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:border-foreground
                           data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:ring-0! 
                           data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:ring-offset-0!`
												)}
											>
												{#if isEventOnDay({ year: date.year, month: date.month, day: date.day })}
													<div
														class="absolute top-[5px] block size-1 rounded-full bg-yellow-500 group-data-selected:bg-yellow-500"
													></div>
												{/if}
												{date.day}
											</RangeCalendar.Day>
										</RangeCalendar.Cell>
									{/each}
								</RangeCalendar.GridRow>
							{/each}
						</RangeCalendar.GridBody>
					</RangeCalendar.Grid>
				{/each}
			</div>
		{/if}
	{/snippet}
</RangeCalendar.Root>
{#if calendarOpen}<div class="-mt-4 flex justify-center">
		<Button
			class="my-0 text-muted-foreground"
			variant="ghost"
			size="icon-sm"
			onclick={() => (calendarOpen = false)}
			><ChevronUpIcon class="size-4" aria-hidden="true" /></Button
		>
	</div>
{/if}
