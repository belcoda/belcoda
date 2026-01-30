<script lang="ts">
	import type { EventSchema } from '$lib/schema/event';
	import type { OrganizationSchema } from '$lib/schema/organization';
	import {
		downloadICalFile,
		generateGoogleCalendarUrl,
		generateOutlookUrl
	} from '$lib/utils/calendar';
	import { page } from '$app/state';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Download from '@lucide/svelte/icons/download';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	type Props = {
		event: EventSchema;
		organization: OrganizationSchema;
	};

	const { event, organization }: Props = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	function handleAddToGoogleCalendar() {
		const url = generateGoogleCalendarUrl({
			event,
			organization,
			locale: page.data.locale
		});
		window.open(url, '_blank');
		isOpen = false;
	}

	function handleAddToOutlook() {
		const url = generateOutlookUrl({
			event,
			organization,
			locale: page.data.locale
		});
		window.open(url, '_blank');
		isOpen = false;
	}

	function handleDownloadICalFile() {
		downloadICalFile({
			event,
			organization,
			locale: page.data.locale
		});
		isOpen = false;
	}
</script>

<div class="relative" bind:this={dropdownRef}>
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="flex w-full items-center justify-center space-x-2 rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
	>
		<CalendarDays class="h-4 w-4" />
		<span>Add To Calendar</span>
		<ChevronDown class="h-4 w-4 transition-transform {isOpen ? 'rotate-180' : ''}" />
	</button>

	{#if isOpen}
		<div
			class="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border border-gray-200 bg-white shadow-lg"
		>
			<div class="py-1">
				<button
					type="button"
					onclick={handleAddToGoogleCalendar}
					class="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
				>
					<ExternalLink class="h-4 w-4 text-gray-400" />
					<span>Google Calendar</span>
				</button>

				<button
					type="button"
					onclick={handleAddToOutlook}
					class="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
				>
					<ExternalLink class="h-4 w-4 text-gray-400" />
					<span>Outlook Calendar</span>
				</button>

				<button
					type="button"
					onclick={handleDownloadICalFile}
					class="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
				>
					<Download class="h-4 w-4 text-gray-400" />
					<span>Download .ics file</span>
				</button>
			</div>
		</div>
	{/if}
</div>
