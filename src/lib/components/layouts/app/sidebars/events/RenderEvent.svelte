<script lang="ts">
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import LinkIcon from '@lucide/svelte/icons/link';
	import StarIcon from '@lucide/svelte/icons/star';
	import type { ReadEventZero } from '$lib/schema/event';

	let { event, isFavourite = false }: { event: ReadEventZero; isFavourite?: boolean } = $props();
	import { renderEventTime } from '$lib/utils/date';
	import { renderAddress, isAddressComplete } from '$lib/utils/string/address';
	import { appState } from '$lib/state.svelte';
	import { getLocalTimeZone } from '@internationalized/date';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
	import { locale, t } from '$lib/index.svelte';
	/* svelte-ignore state_referenced_locally */
	const time = renderEventTime(event.startsAt, event.endsAt, locale.current, event.timezone);
	import RenderEventDetails from './RenderEventDetails.svelte';
	import { page } from '$app/state';
</script>

<a
	href={`/events/${event.id}`}
	data-testid="event-sidebar-item"
	data-event-id={event.id}
	class="flex w-full items-center justify-start gap-3 border-b px-2 py-3 last:border-b-0 hover:bg-muted"
	class:bg-muted={page.url.pathname.startsWith(`/events/${event.id}`)}
>
	<div class="w-12">
		<Avatar
			src={event.featureImage}
			name1={event.title}
			class="size-12 rounded-lg"
			imageClass="rounded-lg object-cover"
		/>
	</div>
	<div class="grow">
		<div class="flex w-full items-center justify-start gap-2">
			<div class="line-clamp-1 text-sm font-medium">{event.title}</div>
			{#if isFavourite}
				<span
					class="shrink-0 text-amber-500"
					role="img"
					aria-label={t`Favourite`}
					title={t`Favourite`}
					data-testid="favourite-event-indicator"
				>
					<StarIcon class="size-4" fill="currentColor" aria-hidden="true" />
				</span>
			{/if}
		</div>
		<RenderEventDetails {event} />
	</div>
	<ColorBadge color={event.published ? 'green' : 'gray'}>
		{event.published ? 'Published' : 'Draft'}
	</ColorBadge>
</a>
