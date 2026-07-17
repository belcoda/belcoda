<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { locale } from '$lib/index.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { MAX_LIST_PAGE_SIZE } from '$lib/schema/helpers';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';

	const eventsFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 6 }),
		status: 'published' as const,
		dateRange: { start: Date.now() }
	}));

	const eventsQuery = $derived.by(() => z.createQuery(queries.event.list(eventsFilter)));
	// Skip the first event — it's shown in NextEventCard
	const upcomingEvents = $derived(eventsQuery.data?.slice(1) ?? []);

	// Fetch all org signups once and group by eventId
	const signupsFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: MAX_LIST_PAGE_SIZE }),
		includeDeleted: false,
		includeIncomplete: false
	}));
	const signupsQuery = $derived.by(() => z.createQuery(queries.eventSignup.list(signupsFilter)));
	const signupsByEvent = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const s of signupsQuery.data ?? []) {
			if (s.eventId) map[s.eventId] = (map[s.eventId] ?? 0) + 1;
		}
		return map;
	});

	function getLocation(event: (typeof upcomingEvents)[number]): string | null {
		if (event.addressLine1) {
			const parts = [event.addressLine1, event.locality].filter(Boolean);
			return parts.join(', ');
		}
		if (event.onlineLink) return 'Online';
		return null;
	}

	function formatDate(startsAt: number, timezone: string): { day: string; month: string } {
		const d = new Date(startsAt);
		return {
			day: d.toLocaleDateString(locale.current, { day: '2-digit', timeZone: timezone }),
			month: d.toLocaleDateString(locale.current, { month: 'short', timeZone: timezone })
		};
	}
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<Card.Title class="text-sm">Upcoming events</Card.Title>
			{#if upcomingEvents.length > 0}
				<span
					class="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
				>
					{upcomingEvents.length}
				</span>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="space-y-2 pt-0">
		{#if eventsQuery.details.type === 'unknown'}
			<p class="py-4 text-center text-xs text-muted-foreground">Loading...</p>
		{:else if upcomingEvents.length === 0}
			<p class="py-4 text-center text-xs text-muted-foreground">No other upcoming events.</p>
		{:else}
			{#each upcomingEvents as event (event.id)}
				{@const dateBlock = formatDate(event.startsAt, event.timezone)}
				{@const loc = getLocation(event)}
				{@const count = signupsByEvent[event.id] ?? 0}
				<a
					href="/events/{event.id}"
					class="flex items-center gap-3 rounded-md border p-3 no-underline hover:bg-muted/50"
				>
					<div
						class="flex shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 px-2.5 py-2 text-center"
					>
						<span class="text-sm leading-none font-semibold text-primary">{dateBlock.day}</span>
						<span class="mt-0.5 text-[9px] tracking-wider text-primary/70 uppercase"
							>{dateBlock.month}</span
						>
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{event.title}</p>
						<div class="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
							<span class="flex items-center gap-1">
								<UsersIcon class="size-3" />{count} signed up
							</span>
							{#if loc}
								<span class="flex items-center gap-1">
									<MapPinIcon class="size-3" />{loc}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		{/if}
		<Button variant="outline" size="sm" href="/events" class="mt-1 h-7 w-full text-xs">
			View all events
		</Button>
	</Card.Content>
</Card.Root>
