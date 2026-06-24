<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { locale } from '$lib/index.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';

	const eventsFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 5 }),
		status: 'published' as const,
		dateRange: { start: Date.now() }
	}));

	const eventsQuery = $derived.by(() => z.createQuery(queries.event.list(eventsFilter)));
	// The first event is shown in NextEventCard — show the next 4
	const upcomingEvents = $derived(eventsQuery.data?.slice(1, 5) ?? []);

	function formatDate(startsAt: number, timezone: string): { day: string; month: string } {
		const d = new Date(startsAt);
		return {
			day: d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: timezone }),
			month: d.toLocaleDateString('en-GB', { month: 'short', timeZone: timezone })
		};
	}
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="pb-2">
		<Card.Title class="text-sm">Upcoming</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-2 pt-0">
		{#if eventsQuery.details.type === 'unknown'}
			<p class="py-4 text-center text-xs text-muted-foreground">Loading...</p>
		{:else if upcomingEvents.length === 0}
			<p class="py-4 text-center text-xs text-muted-foreground">No other upcoming events.</p>
		{:else}
			{#each upcomingEvents as event (event.id)}
				{@const dateBlock = formatDate(event.startsAt, event.timezone)}
				<a
					href="/events/{event.id}"
					class="flex items-center gap-3 rounded-md border p-2.5 no-underline hover:bg-muted/50"
				>
					<div
						class="flex shrink-0 flex-col items-center justify-center rounded bg-primary/10 px-2 py-1 text-center"
					>
						<span class="text-sm leading-none font-medium text-primary">{dateBlock.day}</span>
						<span class="mt-0.5 text-[9px] tracking-wider text-primary/70 uppercase"
							>{dateBlock.month}</span
						>
					</div>
					<p class="min-w-0 truncate text-xs font-medium">{event.title}</p>
				</a>
			{/each}
		{/if}
		<Button variant="outline" size="sm" href="/events" class="mt-1 h-7 w-full text-xs">
			View all events
		</Button>
	</Card.Content>
</Card.Root>
