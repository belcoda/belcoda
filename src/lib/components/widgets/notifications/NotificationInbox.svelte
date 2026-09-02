<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { locale, t } from '$lib/index.svelte';
	import type { NotificationPayload } from '$lib/schema/notification/payload';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { z } from '$lib/zero.svelte';

	const typeLabelMap: Record<string, string> = {
		whatsapp_unread: t`Unread WhatsApp`,
		whatsapp_message: t`WhatsApp message`,
		flow_notify_user: t`Flow notification`,
		event_signup: t`Event signup`,
		petition_signup: t`Petition signup`,
		person_note_mention: t`Note mention`,
		generic: t`Notification`
	};

	const notifications = $derived(appState.notificationItems);
	const hasUnreadNotifications = $derived(appState.hasUnreadNotifications);

	let busyIds = $state<Record<string, boolean>>({});
	let markAllBusy = $state(false);

	function getTypeLabel(type: string) {
		return typeLabelMap[type] ?? t`Notification`;
	}

	function mentionDetails(notification: (typeof notifications)[number]) {
		if (notification.type !== 'person_note_mention') return null;
		const payload = notification.payload as NotificationPayload | null;
		const authorName = payload?.noteAuthorName ?? t`A teammate`;
		const personName = payload?.personName;
		return {
			message: personName
				? t`${authorName} mentioned you in a note about ${personName}.`
				: t`${authorName} mentioned you in a note.`,
			preview: payload?.notePreview?.trim() || null,
			href: payload?.personId
				? resolve(`/community/${payload.personId}#note-${notification.referenceId}`)
				: null
		};
	}

	function setBusy(notificationId: string, isBusy: boolean) {
		const next = { ...busyIds };
		if (isBusy) {
			next[notificationId] = true;
		} else {
			delete next[notificationId];
		}
		busyIds = next;
	}

	async function markAsRead(notificationId: string) {
		if (busyIds[notificationId] || markAllBusy) {
			return;
		}
		setBusy(notificationId, true);
		try {
			await z.mutate(
				mutators.notification.markAsRead({
					metadata: {
						organizationId: appState.organizationId,
						notificationId
					}
				})
			);
		} finally {
			setBusy(notificationId, false);
		}
	}

	async function dismiss(notificationId: string) {
		if (busyIds[notificationId] || markAllBusy) {
			return;
		}
		setBusy(notificationId, true);
		try {
			await z.mutate(
				mutators.notification.dismiss({
					metadata: {
						organizationId: appState.organizationId,
						notificationId
					}
				})
			);
		} finally {
			setBusy(notificationId, false);
		}
	}

	async function markAllAsRead() {
		if (markAllBusy || !hasUnreadNotifications) {
			return;
		}
		markAllBusy = true;
		try {
			await z.mutate(
				mutators.notification.markAllAsRead({
					metadata: {
						organizationId: appState.organizationId
					}
				})
			);
		} finally {
			markAllBusy = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b py-3 ps-4 pe-14">
		<h2 class="text-lg font-semibold">{t`Notifications`}</h2>
		<Button
			variant="ghost"
			size="sm"
			onclick={markAllAsRead}
			disabled={markAllBusy || !hasUnreadNotifications}
		>
			{t`Mark all as read`}
		</Button>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if appState.notifications.details.type === 'unknown'}
			<p class="px-4 py-6 text-sm text-muted-foreground">{t`Loading notifications...`}</p>
		{:else if appState.notifications.details.type === 'error'}
			<p class="px-4 py-6 text-sm text-destructive">{t`Unable to load notifications.`}</p>
		{:else if notifications.length === 0}
			<p class="px-4 py-6 text-sm text-muted-foreground">{t`No notifications yet.`}</p>
		{:else}
			<ul>
				{#each notifications as notification (notification.id)}
					{@const mention = mentionDetails(notification)}
					<li class="border-b px-4 py-3">
						<div class="mb-1 flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<span
									class={`size-2 rounded-full ${notification.status === 'unread' ? 'bg-primary' : 'bg-muted-foreground/50'}`}
								></span>
								<p class="text-sm font-medium">{getTypeLabel(notification.type)}</p>
							</div>
							<p class="text-xs text-muted-foreground">
								{notification.createdAt === null
									? t`Unknown time`
									: formatShortTimestamp(notification.createdAt, locale.current)}
							</p>
						</div>
						<p class="mb-3 text-xs text-muted-foreground capitalize">{notification.status}</p>
						{#if mention}
							<p class="mb-1 text-sm">{mention.message}</p>
							{#if mention.preview}
								<p class="mb-3 line-clamp-2 text-xs text-muted-foreground">{mention.preview}</p>
							{/if}
						{/if}
						<div class="flex items-center gap-2">
							{#if mention?.href}
								<Button
									variant="outline"
									size="sm"
									href={mention.href}
									onclick={() => markAsRead(notification.id)}
									disabled={busyIds[notification.id] || markAllBusy}
								>
									{t`View note`}
								</Button>
							{/if}
							{#if notification.status === 'unread'}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => markAsRead(notification.id)}
									disabled={busyIds[notification.id] || markAllBusy}
								>
									{t`Mark as read`}
								</Button>
							{/if}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => dismiss(notification.id)}
								disabled={busyIds[notification.id] || markAllBusy}
							>
								{t`Dismiss`}
							</Button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
