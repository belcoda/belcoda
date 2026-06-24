<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import UsersIcon from '@lucide/svelte/icons/users';

	const event = {
		day: '02',
		month: 'Jul',
		title: 'Community town hall — July 2026',
		location: 'City Hall, Room 4',
		time: '6:00 PM – 8:30 PM',
		signups: 47,
		capacity: 80,
		hasWhatsApp: true,
		href: '/events'
	};

	const capacityPct = $derived(Math.round((event.signups / event.capacity) * 100));
</script>

{#if event}
	<Card.Root class="rounded-lg">
		<Card.Header class="pb-3">
			<div class="flex items-center justify-between">
				<Card.Title class="text-sm">Next event</Card.Title>
				<Badge
					variant="secondary"
					class="border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
				>
					Published
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="space-y-3 pt-0">
			<div class="flex items-center gap-3">
				<div
					class="flex shrink-0 flex-col items-center justify-center rounded-md bg-primary px-3 py-2 text-center"
				>
					<span class="text-xl leading-none font-medium text-primary-foreground">{event.day}</span>
					<span class="mt-1 text-[10px] tracking-wider text-primary-foreground/70 uppercase"
						>{event.month}</span
					>
				</div>
				<p class="min-w-0 text-sm leading-snug font-medium">{event.title}</p>
			</div>

			<div class="space-y-1 text-xs text-muted-foreground">
				<span class="flex items-center gap-1.5"><MapPinIcon class="size-3" />{event.location}</span>
				<span class="flex items-center gap-1.5"><ClockIcon class="size-3" />{event.time}</span>
				<span class="flex items-center gap-1.5"
					><UsersIcon class="size-3" />{event.signups} / {event.capacity} signed up</span
				>
			</div>

			<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div class="h-1.5 rounded-full bg-primary" style="width: {capacityPct}%"></div>
			</div>

			{#if event.hasWhatsApp}
				<div
					class="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
				>
					<MessageCircleIcon class="size-3.5 shrink-0 text-emerald-600" />
					<span>WhatsApp flow active</span>
				</div>
			{/if}

			<div class="flex gap-2">
				<Button href={event.href} size="sm" class="h-7 flex-1 text-xs">View signups</Button>
				<Button variant="outline" size="sm" class="h-7 text-xs">
					<Share2Icon class="size-3.5" />
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
