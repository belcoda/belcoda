<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import NotificationBell from '$lib/components/widgets/notifications/NotificationBell.svelte';
	import BoltIcon from '@lucide/svelte/icons/bolt';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCheck from '@lucide/svelte/icons/check-check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import UsersIcon from '@lucide/svelte/icons/users';

	type NotifType =
		| 'whatsapp_unread'
		| 'whatsapp_message'
		| 'flow_notify_user'
		| 'event_signup'
		| 'petition_signup'
		| 'generic';

	type NotifStatus = 'unread' | 'read';

	interface MockNotification {
		id: string;
		type: NotifType;
		status: NotifStatus;
		title: string;
		meta: string;
		time: string;
		actionLabel: string;
		actionHref: string;
	}

	const metrics = [
		{ label: 'Upcoming events', value: '8', sub: 'Next: Jul 2' },
		{ label: 'Event signups', value: '342', sub: '+28 this week' },
		{ label: 'Community size', value: '1,847', sub: '+12 this week' },
		{ label: 'Active petitions', value: '3', sub: '2,104 signatures' }
	];

	const mockNotifications: MockNotification[] = [
		{
			id: '1',
			type: 'whatsapp_unread',
			status: 'unread',
			title: 'Sofia Martinez replied in thread #47',
			meta: '2 min ago · "Yes I\'ll be there, can I bring a friend?"',
			time: '2 min ago',
			actionLabel: 'Reply',
			actionHref: '/communications/whatsapp/sent'
		},
		{
			id: '2',
			type: 'whatsapp_message',
			status: 'unread',
			title: 'James Kariuki — new inbound message',
			meta: '18 min ago · First message from this contact',
			time: '18 min ago',
			actionLabel: 'Open thread',
			actionHref: '/communications/whatsapp/sent'
		},
		{
			id: '3',
			type: 'flow_notify_user',
			status: 'unread',
			title: 'Onboarding flow: Priya Okonkwo needs manual review',
			meta: '35 min ago · Triggered by notifyUser node',
			time: '35 min ago',
			actionLabel: 'Review',
			actionHref: '/community'
		},
		{
			id: '4',
			type: 'event_signup',
			status: 'unread',
			title: '5 new signups for Community town hall',
			meta: '1 hour ago · 47 / 80 total',
			time: '1 hour ago',
			actionLabel: 'View signups',
			actionHref: '/events'
		},
		{
			id: '5',
			type: 'generic',
			status: 'read',
			title: 'Email blast "June update" delivered to 1,204 people',
			meta: 'Yesterday',
			time: 'Yesterday',
			actionLabel: 'View',
			actionHref: '/communications/email/sent'
		}
	];

	const nextEvent = {
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

	const upcomingEvents = [
		{ day: '12', month: 'Jul', title: 'Volunteer training session', href: '/events' },
		{ day: '19', month: 'Jul', title: 'Canvassing launch day', href: '/events' }
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

	const whatsappNotifs = mockNotifications.filter(
		(n) => n.type === 'whatsapp_unread' || n.type === 'whatsapp_message'
	);
	const flowNotifs = mockNotifications.filter((n) => n.type === 'flow_notify_user');
	const eventNotifs = mockNotifications.filter((n) => n.type === 'event_signup');
	const readNotifs = mockNotifications.filter((n) => n.status === 'read');
	const unreadCount = mockNotifications.filter((n) => n.status === 'unread').length;
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="min-h-full bg-background">
	<div class="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
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

		<!-- Main content: inbox + event sidebar -->
		<section class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
			<!-- Inbox -->
			<Card.Root class="rounded-lg">
				<Card.Header class="border-b px-4 py-3">
					<div class="flex items-center gap-2">
						<InboxIcon class="size-4 text-muted-foreground" />
						<span class="font-medium">Inbox</span>
						{#if unreadCount > 0}
							<Badge variant="destructive" class="ml-auto">{unreadCount} unread</Badge>
						{:else}
							<Badge variant="secondary" class="ml-auto">All clear</Badge>
						{/if}
					</div>
				</Card.Header>
				<Card.Content class="p-0">
					{#if unreadCount === 0 && readNotifs.length === 0}
						<!-- Empty state -->
						<div class="flex flex-col items-center gap-2 px-4 py-12 text-center">
							<CheckCheck class="size-8 text-muted-foreground" />
							<p class="text-sm font-medium">You're all caught up</p>
							<p class="max-w-xs text-xs text-muted-foreground">
								No unread notifications. New WhatsApp replies and flow alerts will appear here.
							</p>
						</div>
					{:else}
						<!-- WhatsApp group -->
						{#if whatsappNotifs.length > 0}
							<div
								class="border-b bg-muted/40 px-4 py-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
							>
								WhatsApp — needs reply
							</div>
							{#each whatsappNotifs as notif (notif.id)}
								<div
									class="flex items-start gap-3 border-b px-4 py-3 {notif.status === 'unread'
										? 'bg-background'
										: 'bg-muted/30'}"
								>
									<span
										class="mt-0.5 size-2 shrink-0 rounded-full {notif.status === 'unread'
											? 'bg-primary'
											: 'bg-transparent'}"
									></span>
									<div
										class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
									>
										<MessageCircleIcon class="size-4" />
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm leading-snug font-medium">{notif.title}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">{notif.meta}</p>
										<div class="mt-2 flex gap-2">
											<Button href={notif.actionHref} size="sm" class="h-7 text-xs"
												>{notif.actionLabel}</Button
											>
											<Button variant="outline" size="sm" class="h-7 text-xs">Dismiss</Button>
										</div>
									</div>
								</div>
							{/each}
						{/if}

						<!-- Flow alerts group -->
						{#if flowNotifs.length > 0}
							<div
								class="border-b bg-muted/40 px-4 py-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
							>
								Flow alerts
							</div>
							{#each flowNotifs as notif (notif.id)}
								<div class="flex items-start gap-3 border-b px-4 py-3">
									<span class="mt-0.5 size-2 shrink-0 rounded-full bg-primary"></span>
									<div
										class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
									>
										<BoltIcon class="size-4" />
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm leading-snug font-medium">{notif.title}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">{notif.meta}</p>
										<div class="mt-2 flex gap-2">
											<Button href={notif.actionHref} size="sm" class="h-7 text-xs"
												>{notif.actionLabel}</Button
											>
											<Button variant="outline" size="sm" class="h-7 text-xs">Dismiss</Button>
										</div>
									</div>
								</div>
							{/each}
						{/if}

						<!-- Event signups group -->
						{#if eventNotifs.length > 0}
							<div
								class="border-b bg-muted/40 px-4 py-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
							>
								Event signups
							</div>
							{#each eventNotifs as notif (notif.id)}
								<div class="flex items-start gap-3 border-b px-4 py-3">
									<span class="mt-0.5 size-2 shrink-0 rounded-full bg-primary"></span>
									<div
										class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
									>
										<CalendarIcon class="size-4" />
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm leading-snug font-medium">{notif.title}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">{notif.meta}</p>
										<div class="mt-2 flex gap-2">
											<Button href={notif.actionHref} size="sm" class="h-7 text-xs"
												>{notif.actionLabel}</Button
											>
											<Button variant="outline" size="sm" class="h-7 text-xs">Dismiss</Button>
										</div>
									</div>
								</div>
							{/each}
						{/if}

						<!-- Read/older items -->
						{#if readNotifs.length > 0}
							<div
								class="border-b bg-muted/40 px-4 py-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
							>
								Earlier
							</div>
							{#each readNotifs as notif (notif.id)}
								<div class="flex items-start gap-3 border-b bg-muted/20 px-4 py-3 last:border-b-0">
									<span class="mt-0.5 size-2 shrink-0"></span>
									<div
										class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
									>
										<MegaphoneIcon class="size-4" />
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm leading-snug text-muted-foreground">{notif.title}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">{notif.time}</p>
									</div>
								</div>
							{/each}
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Right sidebar: next event + upcoming -->
			<div class="flex flex-col gap-4">
				<!-- Next event -->
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
						<!-- Date block -->
						<div class="flex items-center gap-3">
							<div
								class="flex shrink-0 flex-col items-center justify-center rounded-md bg-primary px-3 py-2 text-center"
							>
								<span class="text-xl leading-none font-medium text-primary-foreground"
									>{nextEvent.day}</span
								>
								<span class="mt-1 text-[10px] tracking-wider text-primary-foreground/70 uppercase"
									>{nextEvent.month}</span
								>
							</div>
							<div class="min-w-0">
								<p class="text-sm leading-snug font-medium">{nextEvent.title}</p>
							</div>
						</div>

						<!-- Meta -->
						<div class="space-y-1 text-xs text-muted-foreground">
							<span class="flex items-center gap-1.5"
								><MapPinIcon class="size-3" />{nextEvent.location}</span
							>
							<span class="flex items-center gap-1.5"
								><ClockIcon class="size-3" />{nextEvent.time}</span
							>
							<span class="flex items-center gap-1.5"
								><UsersIcon class="size-3" />{nextEvent.signups} / {nextEvent.capacity} signed up</span
							>
						</div>

						<!-- Capacity bar -->
						<div>
							<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div class="h-1.5 rounded-full bg-primary" style="width: {capacityPct}%"></div>
							</div>
						</div>

						<!-- WhatsApp bar -->
						{#if nextEvent.hasWhatsApp}
							<div
								class="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
							>
								<MessageCircleIcon class="size-3.5 shrink-0 text-emerald-600" />
								<span>WhatsApp flow active</span>
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-2">
							<Button href={nextEvent.href} size="sm" class="h-7 flex-1 text-xs"
								>View signups</Button
							>
							<Button variant="outline" size="sm" class="h-7 text-xs">
								<Share2Icon class="size-3.5" />
							</Button>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Upcoming events -->
				<Card.Root class="rounded-lg">
					<Card.Header class="pb-2">
						<Card.Title class="text-sm">Upcoming</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2 pt-0">
						{#each upcomingEvents as event}
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
			</div>
		</section>
	</div>
</div>
