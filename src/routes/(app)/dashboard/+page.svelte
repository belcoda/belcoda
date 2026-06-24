<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import NotificationBell from '$lib/components/widgets/notifications/NotificationBell.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import UsersIcon from '@lucide/svelte/icons/users';

	const metrics = [
		{ label: 'Upcoming events', value: '8', sub: 'Next: Jul 2' },
		{ label: 'Event signups', value: '342', sub: '+28 this week' },
		{ label: 'Community size', value: '1,847', sub: '+12 this week' },
		{ label: 'Active petitions', value: '3', sub: '2,104 signatures' }
	];

	const nextEvent = {
		day: '02',
		month: 'Jul',
		title: 'Community town hall — July 2026',
		description:
			'Join us for our monthly town hall to discuss community priorities, hear from local leaders, and organize around our shared goals.',
		location: 'City Hall, Room 4',
		time: '6:00 PM – 8:30 PM',
		signups: 47,
		capacity: 80,
		hasWhatsApp: true
	};

	const upcomingEvents = [
		{
			day: '12',
			month: 'Jul',
			title: 'Volunteer training session',
			signups: 23,
			venue: 'Online',
			tags: ['volunteers', 'training']
		},
		{
			day: '19',
			month: 'Jul',
			title: 'Canvassing launch day',
			signups: 61,
			venue: 'Riverside Park',
			tags: ['canvassing']
		}
	];

	const notifications = [
		{
			text: 'Sofia Martinez signed up for Town Hall',
			time: '2 min ago',
			colorClass: 'bg-primary'
		},
		{
			text: 'New WhatsApp message in thread #47',
			time: '15 min ago',
			colorClass: 'bg-primary'
		},
		{
			text: 'Petition "Fair housing now" reached 500 signatures',
			time: '1 hour ago',
			colorClass: 'bg-emerald-600'
		},
		{
			text: 'Email blast "June update" delivered to 1,204 people',
			time: 'Yesterday',
			colorClass: 'bg-muted-foreground'
		}
	];

	const capacityPct = Math.round((nextEvent.signups / nextEvent.capacity) * 100);

	const today = new Date();
	const greeting = (() => {
		const h = today.getHours();
		if (h < 12) return 'Good morning';
		if (h < 18) return 'Good afternoon';
		return 'Good evening';
	})();

	const dateLabel = today.toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="min-h-full bg-background">
	<div class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
		<!-- Header -->
		<header class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-xl font-medium text-foreground">{greeting}, Amara</h1>
				<p class="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
			</div>
			<div class="flex items-center gap-2">
				<NotificationBell />
				<Button href="/events/new" size="sm">
					<PlusIcon class="size-4" />
					New event
				</Button>
			</div>
		</header>

		<!-- Metrics -->
		<section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each metrics as m}
				<div class="rounded-md bg-muted p-3">
					<p class="text-xs text-muted-foreground">{m.label}</p>
					<p class="mt-1 text-2xl font-medium">{m.value}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
				</div>
			{/each}
		</section>

		<!-- Next event hero -->
		<section class="rounded-lg bg-muted p-4">
			<div class="flex gap-4">
				<!-- Date block -->
				<div
					class="flex shrink-0 flex-col items-center justify-center rounded-md bg-primary px-4 py-3 text-center"
				>
					<span class="text-2xl leading-none font-medium text-primary-foreground"
						>{nextEvent.day}</span
					>
					<span class="mt-1.5 text-[11px] tracking-wider text-primary-foreground/70 uppercase"
						>{nextEvent.month}</span
					>
				</div>

				<!-- Content -->
				<div class="min-w-0 flex-1">
					<div class="mb-2 flex items-center gap-2">
						<Badge
							variant="secondary"
							class="border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
							>Published</Badge
						>
						<span class="text-xs text-muted-foreground">Next event</span>
					</div>

					<h2 class="text-sm leading-snug font-medium">{nextEvent.title}</h2>
					<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
						{nextEvent.description}
					</p>

					<div class="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
						<span class="flex items-center gap-1">
							<MapPinIcon class="size-3" />{nextEvent.location}
						</span>
						<span class="flex items-center gap-1">
							<ClockIcon class="size-3" />{nextEvent.time}
						</span>
						<span class="flex items-center gap-1">
							<UsersIcon class="size-3" />{nextEvent.signups} / {nextEvent.capacity} signed up
						</span>
					</div>

					<!-- Capacity bar -->
					<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
						<div class="h-1.5 rounded-full bg-primary" style="width: {capacityPct}%"></div>
					</div>

					<!-- Actions -->
					<div class="mt-3 flex flex-wrap gap-2">
						<Button href="/events" size="sm">View signups</Button>
						<Button variant="outline" size="sm">
							<MessageCircleIcon class="size-4 text-emerald-600" />
							Send reminder
						</Button>
						<Button variant="outline" size="sm">
							<Share2Icon class="size-4" />
							Share
						</Button>
					</div>
				</div>
			</div>

			<!-- WhatsApp bar -->
			{#if nextEvent.hasWhatsApp}
				<div
					class="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20"
				>
					<MessageCircleIcon class="size-4 shrink-0 text-emerald-600" />
					<span class="text-xs text-emerald-800 dark:text-emerald-400"
						>WhatsApp flow connected — signups via mobile</span
					>
					<Button
						variant="outline"
						size="sm"
						class="ml-auto border-emerald-200 bg-emerald-50 text-xs text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-transparent dark:text-emerald-400"
					>
						Send reminder
					</Button>
				</div>
			{/if}
		</section>

		<!-- Two-column section -->
		<section class="grid gap-4 xl:grid-cols-2">
			<!-- Upcoming events -->
			<Card.Root class="rounded-lg">
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title>Upcoming events</Card.Title>
						<Badge variant="secondary">8</Badge>
					</div>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#each upcomingEvents as event}
						<div class="flex gap-3 rounded-md border p-3">
							<div
								class="flex shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 px-3 py-2 text-center"
							>
								<span class="text-lg leading-none font-medium text-primary">{event.day}</span>
								<span class="mt-1 text-[10px] tracking-wider text-primary/70 uppercase"
									>{event.month}</span
								>
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium">{event.title}</p>
								<p class="mt-0.5 text-xs text-muted-foreground">
									{event.signups} signed up · {event.venue}
								</p>
								<div class="mt-1.5 flex flex-wrap gap-1">
									{#each event.tags as tag}
										<span
											class="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
											>{tag}</span
										>
									{/each}
								</div>
							</div>
						</div>
					{/each}
					<Button variant="outline" class="w-full" href="/events">View all events</Button>
				</Card.Content>
			</Card.Root>

			<!-- Notifications -->
			<Card.Root class="rounded-lg">
				<Card.Header>
					<Card.Title>Recent notifications</Card.Title>
				</Card.Header>
				<Card.Content>
					<ul class="divide-y">
						{#each notifications as notif}
							<li class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
								<span class="mt-1.5 inline-block size-2 shrink-0 rounded-full {notif.colorClass}"
								></span>
								<div class="min-w-0 flex-1">
									<p class="text-sm leading-snug">{notif.text}</p>
									<p class="mt-0.5 text-xs text-muted-foreground">{notif.time}</p>
								</div>
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>
		</section>
	</div>
</div>
