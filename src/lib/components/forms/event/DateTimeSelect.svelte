<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { type SuperForm } from 'sveltekit-superforms';
	import { type Readable } from 'svelte/store';
	import { type CreateEventZero, type UpdateEventZero } from '$lib/schema/event';

	type Errors = Readable<
		{
			path: string;
			messages: string[];
		}[]
	>;

	type Props<T extends CreateEventZero | UpdateEventZero> = {
		form: SuperForm<T>;
		data: SuperForm<T>['form'];
		errors: Errors;
	};
	let {
		form = $bindable(),
		data = $bindable(),
		errors = $bindable()
	}: Props<CreateEventZero | UpdateEventZero> = $props();

	//* FOO IMPORTS (//) *//
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import TimezoneSelect from '$lib/components/ui/custom-select/timezone/timezone.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { toast } from 'svelte-sonner';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, parseAbsolute } from '@internationalized/date';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	let eventType = $state<'standardEvent' | 'allDayEvent' | 'multiDayEvent'>('standardEvent');
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import {
		generateCalendarDate,
		generateTimeString,
		dateTimeToNewTimeZone,
		updateTimestampTime,
		renderDate,
		defaultStartsAtEndsAt
	} from '$lib/components/forms/event/actions';
	const id = $props.id();
	let startDateOpen = $state(false);
	let endDateOpen = $state(false);
	import { appState } from '$lib/state.svelte';
	import { locale } from '$lib/index.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';

	import * as Item from '$lib/components/ui/item/index.js';

	import * as Form from '$lib/components/ui/form/index.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	const startZonedDateTime = $derived(
		parseAbsolute(
			new Date($data.startsAt || new Date().getTime()).toISOString(),
			$data.timezone || getLocalTimeZone()
		)
	);
	const endZonedDateTime = $derived(
		parseAbsolute(
			new Date($data.endsAt || new Date().getTime()).toISOString(),
			$data.timezone || getLocalTimeZone()
		)
	);
	function getStartTime() {
		return $data.startsAt
			? generateTimeString($data.startsAt, $data.timezone || getLocalTimeZone())
			: '18:00:00';
	}
	function setStartTime(time: string) {
		if (time) {
			const newStartsAt = updateTimestampTime(
				time,
				$data.timezone || getLocalTimeZone(),
				$data.startsAt ?? new Date().getTime()
			);
			if ($data.endsAt && newStartsAt > $data.endsAt) {
				toast.error(t`Start date must be before end date`);
				return;
			}
			$data.startsAt = newStartsAt;
		}
	}
	function getEndTime() {
		return $data.endsAt
			? generateTimeString($data.endsAt, $data.timezone || getLocalTimeZone())
			: '20:00:00';
	}
	function setEndTime(time: string) {
		if (time) {
			const newEndsAt = updateTimestampTime(
				time,
				$data.timezone || getLocalTimeZone(),
				$data.endsAt ?? new Date().getTime()
			);
			if ($data.startsAt && newEndsAt < $data.startsAt) {
				toast.error(t`Start date must be before end date`);
				return;
			}
			$data.endsAt = newEndsAt;
		}
	}

	if (!$data.startsAt) {
		const { startsAt } = defaultStartsAtEndsAt($data.timezone || getLocalTimeZone());
		$data.startsAt = startsAt;
	}
	if (!$data.endsAt) {
		const { endsAt } = defaultStartsAtEndsAt($data.timezone || getLocalTimeZone());
		$data.endsAt = endsAt;
	}
</script>

{@render dateTimeSelect()}

{#snippet dateTimeSelect()}
	<div>
		<Collapsible.Root class="w-full space-y-2">
			<div class="flex items-end justify-between gap-4 md:items-end">
				<div class="grid grow grid-cols-2 gap-4 lg:grid-cols-4">
					<div
						class="flex w-full items-end gap-4"
						class:col-span-2={eventType !== 'allDayEvent'}
						class:col-span-4={eventType === 'allDayEvent'}
					>
						{@render startDateInput()}
						{#if eventType === 'multiDayEvent'}
							{@render endDateInput()}
						{/if}
						<div class="block lg:hidden">{@render trigger()}</div>
					</div>
					{#if eventType !== 'allDayEvent'}
						<div class="col-span-1">{@render startTimeInput()}</div>
						<div class="col-span-1">{@render endTimeInput()}</div>
					{/if}
				</div>
				<div class="hidden lg:block">{@render trigger()}</div>
			</div>

			<Collapsible.Content class="mt-6 space-y-2">
				<Item.Root variant="outline">
					<Item.Content class="space-y-6">
						{@render allDayMultiDayCheckboxes()}
						{@render displayTimezoneCheckbox()}
					</Item.Content>
				</Item.Root>
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
{/snippet}

{#snippet startDateInput()}
	<Form.Field {form} name="startsAt" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{eventType === 'multiDayEvent' ? t`Start date` : t`Date`}</Form.Label>
				<Popover.Root bind:open={startDateOpen} {...props}>
					<Popover.Trigger id="{id}-start-date">
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full justify-between font-normal">
								{$data.startsAt
									? renderDate($data.startsAt, $data.timezone || getLocalTimeZone(), locale.current)
									: t`Select date`}
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto overflow-hidden p-0" align="start">
						<Calendar
							type="single"
							value={$data.startsAt
								? generateCalendarDate($data.startsAt, $data.timezone || getLocalTimeZone())
								: undefined}
							captionLayout="dropdown"
							onValueChange={(v) => {
								if (v) {
									$data.startsAt = startZonedDateTime
										.set({
											year: v.year,
											month: v.month,
											day: v.day
										})
										.toDate()
										.getTime();
									if (eventType !== 'multiDayEvent') {
										$data.endsAt = endZonedDateTime
											.set({
												year: v.year,
												month: v.month,
												day: v.day
											})
											.toDate()
											.getTime();
									}
								}
								startDateOpen = false;
							}}
						/>
					</Popover.Content>
				</Popover.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet endDateInput()}
	<Form.Field {form} name="endsAt" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`End date`}</Form.Label>
				<Popover.Root bind:open={endDateOpen} {...props}>
					<Popover.Trigger id="{id}-end-date">
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full justify-between font-normal">
								{$data.endsAt
									? renderDate($data.endsAt, $data.timezone || getLocalTimeZone(), locale.current)
									: t`Select date`}
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto overflow-hidden p-0" align="start">
						<Calendar
							type="single"
							value={$data.endsAt
								? generateCalendarDate($data.endsAt, $data.timezone || getLocalTimeZone())
								: undefined}
							captionLayout="dropdown"
							onValueChange={(v) => {
								if (v) {
									const newEndsAt = endZonedDateTime
										.set({
											year: v.year,
											month: v.month,
											day: v.day
										})
										.toDate()
										.getTime();
									if ($data.startsAt && newEndsAt < $data.startsAt) {
										toast.error(t`End date must be after start date`);
										return;
									}
									$data.endsAt = newEndsAt;
								} else {
									//@ts-expect-error - endsAt cannot be undefined, but the form actually does handle undefined values ok
									$data.endsAt = undefined;
								}
								endDateOpen = false;
							}}
						/>
					</Popover.Content>
				</Popover.Root>
			{/snippet}
		</Form.Control>
	</Form.Field>
{/snippet}

{#snippet startTimeInput()}
	<Form.Field {form} name="startsAt">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`From`}</Form.Label>

				<Input
					type="time"
					{...props}
					step="1"
					bind:value={getStartTime, setStartTime}
					class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			{/snippet}
		</Form.Control>
	</Form.Field>
{/snippet}

{#snippet endTimeInput()}
	<Form.Field {form} name="endsAt">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`To`}</Form.Label>

				<Input
					type="time"
					{...props}
					step="1"
					bind:value={getEndTime, setEndTime}
					class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			{/snippet}
		</Form.Control>
	</Form.Field>
{/snippet}

{#snippet allDayMultiDayCheckboxes()}
	<RadioGroup.Root
		bind:value={eventType}
		onValueChange={(v) => {
			if (v === 'allDayEvent') {
				setStartTime('00:00:00');
				setEndTime('23:59:59');
			} else if (v === 'multiDayEvent') {
				//end date  = start date + 1 day
				const newEndsAt = endZonedDateTime.add({ days: 1 }).toDate().getTime();
				$data.endsAt = newEndsAt;
			}
		}}
	>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="standardEvent" id="standardEvent" />
			<Label for="standardEvent">
				{t`Standard event`}
				<div class="text-sm font-normal text-muted-foreground">
					{t`Start and end at a specific time on the same day.`}
				</div>
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="allDayEvent" id="allDayEvent" />
			<Label for="allDayEvent"
				>{t`All day event`}
				<div class="text-sm font-normal text-muted-foreground">
					{t`Start and end at midnight on the same day (all day).`}
				</div>
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="multiDayEvent" id="multiDayEvent" />
			<Label for="multiDayEvent"
				>{t`Multi-day event`}
				<div class="text-sm font-normal text-muted-foreground">
					{t`Start and end on different days.`}
				</div>
			</Label>
		</div>
	</RadioGroup.Root>
{/snippet}
{#snippet displayTimezoneCheckbox()}
	<Form.Field {form} name="settings.displayTimezone">
		<Form.Control>
			{#snippet children({ props })}
				<div class="flex items-start gap-3">
					<Checkbox
						{...props}
						checked={$data.settings?.displayTimezone}
						onCheckedChange={(v) => {
							if ($data.settings) {
								$data.settings.displayTimezone = v;
							}
						}}
					/>
					<div class="flex flex-col gap-1">
						<Form.Label>{t`Display timezone on signup page and notifications`}</Form.Label>
						<Form.Description>
							{t`This will display the timezone on the signup page and notifications.`}
						</Form.Description>
					</div>
				</div>
			{/snippet}
		</Form.Control>
	</Form.Field>
	{#if $data.settings?.displayTimezone}
		{@render timezoneSelect()}
	{/if}
{/snippet}

{#snippet timezoneSelect()}
	<Form.Field {form} name="timezone">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`Timezone`}</Form.Label>
				<TimezoneSelect
					value={$data.timezone}
					onSelectChange={(v) => {
						if ($data.timezone) {
							const newStartTime = dateTimeToNewTimeZone(startZonedDateTime, v);
							const newEndTime = dateTimeToNewTimeZone(endZonedDateTime, v);
							$data.startsAt = newStartTime.toDate().getTime();
							$data.endsAt = newEndTime.toDate().getTime();
							$data.timezone = v;
						}
					}}
					{...props}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet trigger()}
	<Collapsible.Trigger
		class={buttonVariants({ variant: 'ghost', size: 'default', class: 'w-9 p-0' })}
	>
		<ChevronsUpDownIcon />
		<span class="sr-only">{t`Toggle`}</span>
	</Collapsible.Trigger>
{/snippet}
