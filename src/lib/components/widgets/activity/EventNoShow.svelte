<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import * as dateUtils from '$lib/utils/date';
	import CalendarX from '@lucide/svelte/icons/calendar-x';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();

	const eventSignup = $derived.by(() => {
		return z.createQuery(
			queries.eventSignup.read({ eventSignupId: activity.referenceId })
		);
	});

	const event = $derived.by(() => {
		if (!eventSignup.data) return null;
		return z.createQuery(queries.event.read({ eventId: eventSignup.data.eventId }));
	});
</script>

{#if eventSignup.data && event?.data}
	<div class="w-full px-4 py-2 text-center text-sm text-gray-400">
		<div class="text-xs">{dateUtils.formatShortTimestamp(activity.createdAt)}</div>
		<div class="flex items-center justify-center gap-1">
			Did not attend
			<a class="flex items-center gap-1" href={`/events/${event.data.id}`}>
				<CalendarX class="size-3" />
				<div class="font-medium underline hover:text-gray-500">{event.data.title}</div>
			</a>
		</div>
	</div>
{/if}
