<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { type EventSchema } from '$lib/schema/event';
	import { type OrganizationSchema } from '$lib/schema/organization';
	import { defaultDisplaySettings } from '$lib/schema/organization/settings';
	import CalendarOff from '@lucide/svelte/icons/calendar-off';
	import EventDetails from './EventDetails.svelte';

	type ClosedProps = {
		event: EventSchema;
		organization: OrganizationSchema;
		currentSignups: number;
		layout?: 'default' | 'embed';
	};

	const { event, organization, currentSignups, layout = 'default' }: ClosedProps = $props();

	const primaryColor = $derived(
		organization.settings?.theme?.primaryColor || defaultDisplaySettings.primaryColor
	);
</script>

<div data-testid="event-signup-closed">
	{#if layout === 'embed'}
		<div class="mb-6">
			<h3 class="mb-2 text-lg font-semibold text-gray-900">{event.title}</h3>
			{#if event.shortDescription}
				<p class="mb-2 text-sm text-gray-600">{event.shortDescription}</p>
			{/if}
			<EventDetails {event} {currentSignups} {primaryColor} />
		</div>
	{:else}
		<h3 class="mb-6 text-lg font-semibold text-gray-900">{t`Join this event`}</h3>
	{/if}

	<div class="rounded-md border border-slate-200 bg-slate-50 p-4">
		<div class="flex gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200/80">
				<CalendarOff class="h-5 w-5 text-slate-600" />
			</div>
			<div>
				<p class="text-sm font-medium text-slate-900">{t`Sign-up has closed`}</p>
				<p class="mt-1 text-sm text-slate-600">
					{t`The sign-up period for this event has ended, so you can no longer register on this page.`}
				</p>
			</div>
		</div>
	</div>
</div>
