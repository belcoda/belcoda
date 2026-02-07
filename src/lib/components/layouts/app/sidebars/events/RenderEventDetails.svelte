<script lang="ts">
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import LinkIcon from '@lucide/svelte/icons/link';
	import type { ReadEventZero } from '$lib/schema/event';

	let { event }: { event: ReadEventZero } = $props();
	import { renderEventTime } from '$lib/utils/date';
	import { renderAddress, isAddressComplete } from '$lib/utils/string/address';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { locale } from '$lib/index.svelte';
	const time = renderEventTime(event.startsAt, event.endsAt, locale.current, event.timezone);
</script>

<div class="flex items-center gap-1 text-muted-foreground">
	<div class="w-2.5"><ClockIcon class="size-2.5" /></div>
	<div class="line-clamp-1 grow text-xs">
		{time.dateStr} •
		{time.timeStr}
	</div>
</div>
{#if event.onlineLink}
	<div class="flex items-center gap-1 text-muted-foreground">
		<div class="w-2.5"><LinkIcon class="size-2.5" /></div>
		<div class="line-clamp-1 grow text-xs">
			{event.onlineLink}
		</div>
	</div>
{/if}
{#if isAddressComplete(event)}
	<div class="flex items-center gap-1 text-muted-foreground">
		<div class="w-2.5"><MapPinIcon class="size-2.5" /></div>
		<div class="line-clamp-1 grow text-xs">
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
{/if}
