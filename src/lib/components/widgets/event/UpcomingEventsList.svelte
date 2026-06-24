<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	const events = [
		{ day: '12', month: 'Jul', title: 'Volunteer training session', href: '/events' },
		{ day: '19', month: 'Jul', title: 'Canvassing launch day', href: '/events' }
	];
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="pb-2">
		<Card.Title class="text-sm">Upcoming</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-2 pt-0">
		{#each events as event}
			<a
				href={event.href}
				class="flex items-center gap-3 rounded-md border p-2.5 no-underline hover:bg-muted/50"
			>
				<div
					class="flex shrink-0 flex-col items-center justify-center rounded bg-primary/10 px-2 py-1 text-center"
				>
					<span class="text-sm leading-none font-medium text-primary">{event.day}</span>
					<span class="mt-0.5 text-[9px] tracking-wider text-primary/70 uppercase"
						>{event.month}</span
					>
				</div>
				<p class="min-w-0 truncate text-xs font-medium">{event.title}</p>
			</a>
		{/each}
		<Button variant="outline" size="sm" href="/events" class="mt-1 h-7 w-full text-xs">
			View all events
		</Button>
	</Card.Content>
</Card.Root>
