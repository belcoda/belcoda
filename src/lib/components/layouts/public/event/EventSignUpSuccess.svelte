<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import { locale } from '$lib/index.svelte';
	import { type EventSchema } from '$lib/schema/event';
	import { type OrganizationSchema } from '$lib/schema/organization';

	import { defaultDisplaySettings } from '$lib/schema/organization/settings';

	import Check from '@lucide/svelte/icons/check';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { renderAddress } from '$lib/utils/string/address';
	import { renderEventTime } from '$lib/utils/date';
	import AddToCalendarDropdown from '$lib/components/layouts/public/event/AddToCalendarDropdown.svelte';

	const { event, organization }: { event: EventSchema; organization: OrganizationSchema } =
		$props();

	const primaryColor = $derived(
		organization.settings?.theme?.primaryColor || defaultDisplaySettings.primaryColor
	); // purple/indigo default
	const secondaryColor = $derived(
		organization.settings?.theme?.secondaryColor || defaultDisplaySettings.secondaryColor
	); // Green default

	const eventTimeData = $derived(
		renderEventTime(
			event.startsAt.getTime(),
			event.endsAt.getTime(),
			locale.current,
			event.timezone
		)
	);
</script>

<!-- Success State -->
<div class="p-6 text-center">
	<div
		class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
		style="background-color: {secondaryColor}20;"
	>
		<Check class="h-8 w-8" style="color: {secondaryColor};" />
	</div>
	<h3 class="mb-4 text-xl font-semibold text-gray-900">You're signed up!</h3>

	<p class="mb-2 text-sm text-gray-600">Thanks for signing up for</p>

	<div class="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
		<h4 class="mb-4 text-lg font-medium text-gray-900">{event.title}</h4>
		<div class="flex items-center justify-center space-x-2">
			<CalendarDays class="h-4 w-4" style="color: {primaryColor};" />
			<span>{eventTimeData.dateStr} - {eventTimeData.timeStr}</span>
		</div>
		{#if event.addressLine1}
			<div class="flex items-start justify-center space-x-2">
				<MapPin class="h-4 w-4 shrink-0" style="color: {primaryColor};" />
				<span>
					{renderAddress({
						addressLine1: event.addressLine1,
						addressLine2: event.addressLine2,
						locality: event.locality,
						region: event.region,
						postcode: event.postcode,
						country: event.country,
						locale: locale.current
					})}
				</span>
			</div>
		{/if}
	</div>

	<p class="mb-6 text-sm text-gray-600">We will send you a confirmation email.</p>

	<AddToCalendarDropdown {event} {organization} />
</div>
