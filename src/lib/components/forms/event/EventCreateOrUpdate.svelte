<script lang="ts">
	import SvelteLexical from '$lib/components/ui/wysiwyg/SvelteLexical.svelte';
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import TimezoneSelect from '$lib/components/ui/custom-select/timezone/timezone.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { toast } from 'svelte-sonner';
	import { slugify } from '$lib/utils/slug';
	import { getMeetingPlatform, getMeetingPlatformLogoUrl } from '$lib/utils/events/meeting_link';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, parseAbsolute } from '@internationalized/date';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	let eventType = $state<'standardEvent' | 'allDayEvent' | 'multiDayEvent'>('standardEvent');
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { env } from '$env/dynamic/public';
	const { PUBLIC_ROOT_DOMAIN } = env;
	import { dev } from '$app/environment';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import {
		generateCalendarDate,
		generateTimeString,
		dateTimeToNewTimeZone,
		updateTimestampTime,
		updateTimestampDate,
		convertDateToTimeAtTimezone,
		createDateTwoWeeksFromNow,
		addDays,
		timestampToNewTimeZone,
		renderDate
	} from '$lib/components/forms/event/actions';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	const id = $props.id();
	let startDateOpen = $state(false);
	let endDateOpen = $state(false);
	import { appState } from '$lib/state.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import VideoIcon from '@lucide/svelte/icons/video';
	import LinkIcon from '@lucide/svelte/icons/link';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Item from '$lib/components/ui/item/index.js';
	import createForm from '$lib/form.svelte';
	import { type ReadEventZero, createEventZero, updateEventZero } from '$lib/schema/event';
	const { event }: { event?: ReadEventZero } = $props();
	const { form, data, errors, Errors, Debug, helpers } = event
		? createForm({
				schema: updateEventZero,
				initialData: event,
				onSubmit: async (data) => {
					console.log(data);
				}
			})
		: createForm({
				schema: createEventZero,
				validateOnLoad: false,
				onSubmit: async (data) => {
					console.log(data);
				}
			});
	import * as Form from '$lib/components/ui/form/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
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
				toast.error('Start date must be before end date');
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
				toast.error('Start date must be before end date');
				return;
			}
			$data.endsAt = newEndsAt;
		}
	}
</script>

<form use:form.enhance class="mx-auto flex w-full max-w-4xl flex-col gap-4" id="event-form">
	<Errors {errors} />
	<Card.Root>
		<Card.Header>
			<Card.Title>Basic information</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			{@render titleInput()}
			{@render descriptionInput()}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Date and time</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			{@render dateTimeSelect()}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Location</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			{@render locationTabs()}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Feature image</Card.Title>
			<Card.Description
				>This event will be displayed on the event page and in notifications and shared links.</Card.Description
			>
		</Card.Header>
		<Card.Content class="space-y-6">
			<CroppedImageUpload
				class="aspect-video w-full"
				onUpload={async (bucketUrl) => {
					$data.featureImage = bucketUrl;
				}}
			/>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Event page</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			<SvelteLexical />
		</Card.Content>
	</Card.Root>
	<Debug {data} hide={false} />
</form>

{#snippet trigger()}
	<Collapsible.Trigger
		class={buttonVariants({ variant: 'ghost', size: 'default', class: 'w-9 p-0' })}
	>
		<ChevronsUpDownIcon />
		<span class="sr-only">Toggle</span>
	</Collapsible.Trigger>
{/snippet}

{#snippet titleInput()}
	<Form.Field {form} name="title" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Title</Form.Label>
				<InputGroup.Root>
					<InputGroup.Input
						bind:value={$data.title}
						{...props}
						placeholder="Title"
						oninput={() => {
							console.log(form.isTainted('slug'));
							if (!form.isTainted('slug')) {
								data.update(
									//@ts-expect-error - the $store may contain some uninitialized (ie: undefined) form fields so doesn't match the fully initialized schema
									($store) => {
										const slug = slugify($data.title ?? '');
										return { ...$store, slug };
									},
									{ taint: false }
								);
							}
						}}
					/>
					{#if $data.title && $data.title.length > 0}
						<InputGroup.Addon align="block-end" class="flex items-center justify-end gap-2">
							<InputGroup.Text>
								<LinkIcon class="size-4" /><span class="font-mono text-xs"
									>http{dev ? '' : 's'}://{appState.activeOrganization.data
										?.slug}.{PUBLIC_ROOT_DOMAIN}/events/{$data.slug}</span
								>
								<ResponsiveModal>
									{#snippet trigger()}
										<InputGroup.Button>Edit</InputGroup.Button>
									{/snippet}
									<Form.Field {form} name="slug">
										<Form.Control>
											{#snippet children({ props })}
												<InputGroup.Input bind:value={$data.slug} {...props} placeholder="Slug" />
											{/snippet}
										</Form.Control>
									</Form.Field>
									{#snippet footer()}
										<Button variant="default" size="sm" class="w-full">Save</Button>
									{/snippet}
								</ResponsiveModal>
							</InputGroup.Text>
						</InputGroup.Addon>
					{/if}
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
	</Form.Field>
{/snippet}

{#snippet descriptionInput()}
	<Form.Field {form} name="shortDescription" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Description</Form.Label>
				<InputGroup.Root>
					<InputGroup.Textarea
						bind:value={$data.shortDescription}
						{...props}
						placeholder="Description"
						class="min-h-[80px]"
					/>
					{#if $data.description && $data.description.length > 0}
						<InputGroup.Addon align="block-end" class="justify-end">
							<InputGroup.Text>{$data.description.length} / 1000</InputGroup.Text>
						</InputGroup.Addon>
					{/if}
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
	</Form.Field>
{/snippet}

{#snippet locationTabs()}
	<Tabs.Root value="physical" class="w-full">
		<Tabs.List>
			<Tabs.Trigger value="physical"><MapPinIcon class="size-4" /> In person</Tabs.Trigger>
			<Tabs.Trigger value="virtual"><VideoIcon class="size-4" /> Virtual</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="physical" class="mt-4 space-y-6">
			{@render addressBlock()}
		</Tabs.Content>
		<Tabs.Content value="virtual" class="mt-4 space-y-6">
			{@render videoCallBlock()}
		</Tabs.Content>
	</Tabs.Root>
{/snippet}

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
				<Form.Label>{eventType === 'multiDayEvent' ? 'Start date' : 'Date'}</Form.Label>
				<Popover.Root bind:open={startDateOpen} {...props}>
					<Popover.Trigger id="{id}-start-date">
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full justify-between font-normal">
								{$data.startsAt
									? renderDate(
											$data.startsAt,
											$data.timezone || getLocalTimeZone(),
											appState.locale
										)
									: 'Select date'}
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
	</Form.Field>
{/snippet}

{#snippet endDateInput()}
	<Form.Field {form} name="endsAt" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>End date</Form.Label>
				<Popover.Root bind:open={endDateOpen} {...props}>
					<Popover.Trigger id="{id}-end-date">
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full justify-between font-normal">
								{$data.endsAt
									? renderDate($data.endsAt, $data.timezone || getLocalTimeZone(), appState.locale)
									: 'Select date'}
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
										toast.error('End date must be after start date');
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
				<Form.Label>From</Form.Label>

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
				<Form.Label>To</Form.Label>

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
				Standard event
				<div class="text-sm font-normal text-muted-foreground">
					Start and end at a specific time on the same day.
				</div>
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="allDayEvent" id="allDayEvent" />
			<Label for="allDayEvent"
				>All day event
				<div class="text-sm font-normal text-muted-foreground">
					Start and end at midnight on the same day (all day).
				</div>
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="multiDayEvent" id="multiDayEvent" />
			<Label for="multiDayEvent"
				>Multi-day event
				<div class="text-sm font-normal text-muted-foreground">
					Start and end on different days.
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
							if (v && $data.settings) {
								$data.settings.displayTimezone = v;
							} else {
								$data.settings = {
									displayTimezone: v,
									signupFields: $data.settings?.signupFields ?? { standard: [], custom: [] }
								};
							}
						}}
					/>
					<div class="flex flex-col gap-1">
						<Form.Label>Display timezone on signup page and notifications</Form.Label>
						<Form.Description>
							This will display the timezone on the signup page and notifications.
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
				<Form.Label>Timezone</Form.Label>
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
	</Form.Field>
{/snippet}

{#snippet addressBlock()}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="col-span-2">
			<Form.Field {form} name="addressLine1">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Address line 1</Form.Label>
						<InputGroup.Root>
							<InputGroup.Input
								bind:value={$data.addressLine1}
								{...props}
								placeholder="Address line 1"
							/>
						</InputGroup.Root>
					{/snippet}
				</Form.Control>
			</Form.Field>
		</div>
		<div class="col-span-2">
			<Form.Field {form} name="addressLine2">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Address line 2 (optional)</Form.Label>
						<InputGroup.Root>
							<InputGroup.Input
								bind:value={$data.addressLine2}
								{...props}
								placeholder="Address line 2"
							/>
						</InputGroup.Root>
					{/snippet}
				</Form.Control>
			</Form.Field>
		</div>
		<Form.Field {form} name="locality">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>City/town</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.locality} {...props} placeholder="City/town" />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="region">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Region/state</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.region} {...props} placeholder="Region/state" />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="postcode">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Postcode</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.postcode} {...props} placeholder="Postcode" />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="country">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Country</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.country} {...props} placeholder="Country" />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
	</div>
{/snippet}

{#snippet videoCallBlock()}
	<Form.Field {form} name="onlineLink">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Online link</Form.Label>
				<InputGroup.Root>
					<InputGroup.Input bind:value={$data.onlineLink} {...props} placeholder="Online link" />
					<InputGroup.Addon>
						{#if $data.onlineLink && getMeetingPlatform($data.onlineLink) !== 'other'}
							<img
								src={getMeetingPlatformLogoUrl(getMeetingPlatform($data.onlineLink))}
								alt={getMeetingPlatform($data.onlineLink)}
								class="size-4"
							/>
						{:else}
							<LinkIcon class="size-4" />
						{/if}
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
	</Form.Field>
{/snippet}
