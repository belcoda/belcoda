<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BoltIcon from '@lucide/svelte/icons/bolt';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCheck from '@lucide/svelte/icons/check-check';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import type { NotificationStatus } from '$lib/schema/notification';

	type NotifType =
		| 'whatsapp_unread'
		| 'whatsapp_message'
		| 'flow_notify_user'
		| 'event_signup'
		| 'petition_signup'
		| 'generic';

	interface Notification {
		id: string;
		type: NotifType;
		status: NotificationStatus;
		title: string;
		meta: string;
		time: string;
		actionLabel: string;
		actionHref: string;
	}

	const notifications: Notification[] = [
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

	const whatsappNotifs = $derived(
		notifications.filter((n) => n.type === 'whatsapp_unread' || n.type === 'whatsapp_message')
	);
	const flowNotifs = $derived(notifications.filter((n) => n.type === 'flow_notify_user'));
	const eventNotifs = $derived(notifications.filter((n) => n.type === 'event_signup'));
	const readNotifs = $derived(notifications.filter((n) => n.status === 'read'));
	const unreadCount = $derived(notifications.filter((n) => n.status === 'unread').length);
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="border-b px-4 py-3">
		<div class="flex items-center gap-2">
			<InboxIcon class="size-4 text-muted-foreground" />
			<span class="font-medium">Attention queue</span>
			{#if unreadCount > 0}
				<Badge variant="destructive" class="ml-auto">{unreadCount} unread</Badge>
			{:else}
				<Badge variant="secondary" class="ml-auto">All clear</Badge>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="p-0">
		{#if unreadCount === 0 && readNotifs.length === 0}
			<div class="flex flex-col items-center gap-2 px-4 py-12 text-center">
				<CheckCheck class="size-8 text-muted-foreground" />
				<p class="text-sm font-medium">You're all caught up</p>
				<p class="max-w-xs text-xs text-muted-foreground">
					No unread notifications. New WhatsApp replies and flow alerts will appear here.
				</p>
			</div>
		{:else}
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
