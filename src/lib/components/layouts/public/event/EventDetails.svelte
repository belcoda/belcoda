<script lang="ts">
	import { type EventSchema } from '$lib/schema/event';
	import { renderEventTime } from '$lib/utils/date';
	import { renderAddress } from '$lib/utils/string/address';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LinkIcon from '@lucide/svelte/icons/link';

	const {
		event,
		currentSignups,
		primaryColor
	}: { event: EventSchema; currentSignups: number; primaryColor: string } = $props();

	import { locale } from '$lib/index.svelte';

	const eventTimeData = $derived(
		renderEventTime(
			event.startsAt.getTime(),
			event.endsAt.getTime(),
			locale.current,
			event.timezone
		)
	);
</script>

<div class="flex items-center space-x-3">
	<div class="flex h-10 w-10 items-center justify-center rounded-full">
		<CalendarDaysIcon class="h-5 w-5" style="color: {primaryColor};" />
	</div>
	<div>
		<div class="text-sm font-medium text-gray-900">{eventTimeData.dateStr}</div>
	</div>
</div>

<div class="flex items-center space-x-3">
	<div class="flex h-10 w-10 items-center justify-center rounded-full">
		<ClockIcon class="h-5 w-5" style="color: {primaryColor};" />
	</div>
	<div>
		<div class="text-sm font-medium text-gray-900">
			{eventTimeData.timeStr}
			{#if event.settings?.displayTimezone}
				<span class="text-sm text-gray-500">({event.timezone})</span>
			{/if}
		</div>
	</div>
</div>

{#if event.addressLine1}
	<div class="flex items-center space-x-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-full">
			<MapPinIcon class="h-5 w-5" style="color: {primaryColor};" />
		</div>
		<div>
			<div class="text-sm font-medium text-gray-900">
				{renderAddress({
					addressLine1: event.addressLine1,
					addressLine2: event.addressLine2,
					locality: event.locality,
					region: event.region,
					postcode: event.postcode,
					country: event.country,
					locale: locale.current
				})}
			</div>
		</div>
	</div>
{/if}

<div class="flex items-center space-x-3">
	<div class="flex h-10 w-10 items-center justify-center rounded-full">
		<UsersIcon class="h-5 w-5" style="color: {primaryColor};" />
	</div>
	<div>
		<div class="text-sm font-medium text-gray-900">
			{currentSignups}
			{currentSignups === 1 ? 'person' : 'people'} already signed up
		</div>
		{#if event.maxSignups}
			<div class="text-gray-600">
				Max signups: {event.maxSignups}
			</div>
		{/if}
	</div>
</div>
