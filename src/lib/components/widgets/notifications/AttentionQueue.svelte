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
	import { locale } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { z } from '$lib/zero.svelte';

	const all = $derived(appState.notificationItems);
	type NotificationItem = (typeof appState.notificationItems)[number];

	const whatsappNotifs = $derived(
		all.filter(
			(n) =>
				(n.type === 'whatsapp_unread' || n.type === 'whatsapp_message') && n.status === 'unread'
		)
	);
	const flowNotifs = $derived(
		all.filter((n) => n.type === 'flow_notify_user' && n.status === 'unread')
	);
	const eventNotifs = $derived(
		all.filter((n) => n.type === 'event_signup' && n.status === 'unread')
	);
	const petitionNotifs = $derived(
		all.filter((n) => n.type === 'petition_signup' && n.status === 'unread')
	);
	const readNotifs = $derived(all.filter((n) => n.status === 'read'));
	const unreadCount = $derived(all.filter((n) => n.status === 'unread').length);

	let busyIds = $state<Record<string, boolean>>({});

	function setBusy(id: string, busy: boolean) {
		const next = { ...busyIds };
		if (busy) next[id] = true;
		else delete next[id];
		busyIds = next;
	}

	async function dismiss(notificationId: string) {
		if (busyIds[notificationId]) return;
		setBusy(notificationId, true);
		try {
			await z.mutate(
				mutators.notification.dismiss({
					metadata: { organizationId: appState.organizationId, notificationId }
				})
			);
		} finally {
			setBusy(notificationId, false);
		}
	}

	async function markAsRead(notificationId: string) {
		if (busyIds[notificationId]) return;
		setBusy(notificationId, true);
		try {
			await z.mutate(
				mutators.notification.markAsRead({
					metadata: { organizationId: appState.organizationId, notificationId }
				})
			);
		} finally {
			setBusy(notificationId, false);
		}
	}

	function actionHref(n: NotificationItem): string {
		switch (n.type) {
			case 'whatsapp_unread':
			case 'whatsapp_message':
				return '/communications/whatsapp/sent';
			case 'flow_notify_user':
				return '/community';
			case 'event_signup':
				return n.referenceId ? `/events/${n.referenceId}/signups` : '/events';
			case 'petition_signup':
				return n.referenceId ? `/petitions/${n.referenceId}` : '/petitions';
			default:
				return '/dashboard';
		}
	}

	function actionLabel(type: string): string {
		switch (type) {
			case 'whatsapp_unread':
			case 'whatsapp_message':
				return 'Open thread';
			case 'flow_notify_user':
				return 'Review';
			case 'event_signup':
				return 'View signups';
			case 'petition_signup':
				return 'View signatures';
			default:
				return 'View';
		}
	}

	function typeLabel(type: string): string {
		switch (type) {
			case 'whatsapp_unread':
			case 'whatsapp_message':
				return 'WhatsApp message';
			case 'flow_notify_user':
				return 'Flow notification';
			case 'event_signup':
				return 'Event signup';
			case 'petition_signup':
				return 'Petition signature';
			default:
				return 'Notification';
		}
	}

	function timestamp(n: NotificationItem): string {
		if (n.createdAt == null) return '';
		return formatShortTimestamp(n.createdAt, locale.current);
	}
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
		{#if appState.notifications.details.type === 'unknown'}
			<p class="px-4 py-8 text-sm text-muted-foreground">Loading...</p>
		{:else if appState.notifications.details.type === 'error'}
			<p class="px-4 py-8 text-sm text-destructive">Unable to load notifications.</p>
		{:else if all.length === 0}
			<div class="flex flex-col items-center gap-2 px-4 py-12 text-center">
				<CheckCheck class="size-8 text-muted-foreground" />
				<p class="text-sm font-medium">You're all caught up</p>
				<p class="max-w-xs text-xs text-muted-foreground">
					New WhatsApp replies and flow alerts will appear here.
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
					<div class="flex items-start gap-3 border-b bg-background px-4 py-3">
						<span class="mt-0.5 size-2 shrink-0 rounded-full bg-primary"></span>
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
						>
							<MessageCircleIcon class="size-4" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm leading-snug font-medium">{typeLabel(notif.type)}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{timestamp(notif)}</p>
							<div class="mt-2 flex gap-2">
								<Button
									href={actionHref(notif)}
									size="sm"
									class="h-7 text-xs"
									onclick={() => markAsRead(notif.id)}
								>
									{actionLabel(notif.type)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="h-7 text-xs"
									onclick={() => dismiss(notif.id)}
									disabled={busyIds[notif.id]}
								>
									Dismiss
								</Button>
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
					<div class="flex items-start gap-3 border-b bg-background px-4 py-3">
						<span class="mt-0.5 size-2 shrink-0 rounded-full bg-primary"></span>
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<BoltIcon class="size-4" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm leading-snug font-medium">{typeLabel(notif.type)}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{timestamp(notif)}</p>
							<div class="mt-2 flex gap-2">
								<Button
									href={actionHref(notif)}
									size="sm"
									class="h-7 text-xs"
									onclick={() => markAsRead(notif.id)}
								>
									{actionLabel(notif.type)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="h-7 text-xs"
									onclick={() => dismiss(notif.id)}
									disabled={busyIds[notif.id]}
								>
									Dismiss
								</Button>
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
					<div class="flex items-start gap-3 border-b bg-background px-4 py-3">
						<span class="mt-0.5 size-2 shrink-0 rounded-full bg-primary"></span>
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<CalendarIcon class="size-4" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm leading-snug font-medium">{typeLabel(notif.type)}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{timestamp(notif)}</p>
							<div class="mt-2 flex gap-2">
								<Button
									href={actionHref(notif)}
									size="sm"
									class="h-7 text-xs"
									onclick={() => markAsRead(notif.id)}
								>
									{actionLabel(notif.type)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="h-7 text-xs"
									onclick={() => dismiss(notif.id)}
									disabled={busyIds[notif.id]}
								>
									Dismiss
								</Button>
							</div>
						</div>
					</div>
				{/each}
			{/if}

			{#if petitionNotifs.length > 0}
				<div
					class="border-b bg-muted/40 px-4 py-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
				>
					Petition signatures
				</div>
				{#each petitionNotifs as notif (notif.id)}
					<div class="flex items-start gap-3 border-b bg-background px-4 py-3">
						<span class="mt-0.5 size-2 shrink-0 rounded-full bg-primary"></span>
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<MegaphoneIcon class="size-4" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm leading-snug font-medium">{typeLabel(notif.type)}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{timestamp(notif)}</p>
							<div class="mt-2 flex gap-2">
								<Button
									href={actionHref(notif)}
									size="sm"
									class="h-7 text-xs"
									onclick={() => markAsRead(notif.id)}
								>
									{actionLabel(notif.type)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="h-7 text-xs"
									onclick={() => dismiss(notif.id)}
									disabled={busyIds[notif.id]}
								>
									Dismiss
								</Button>
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
							<InboxIcon class="size-4" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm leading-snug text-muted-foreground">{typeLabel(notif.type)}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{timestamp(notif)}</p>
						</div>
					</div>
				{/each}
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
