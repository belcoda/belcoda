<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import { locale } from '$lib/index.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';
	import type { NotificationPayload } from '$lib/schema/notification/payload';

	const filter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 10 }),
		status: null
	}));

	const query = $derived.by(() => z.createQuery(queries.notification.list(filter)));
	const notifications = $derived(query.data ?? []);
	type NotificationItem = NonNullable<(typeof query)['data']>[number];
	type NotificationGroup = {
		key: string;
		type: string;
		referenceId: string;
		notifications: NotificationItem[];
		latestAt: number | null;
		personNames: string[];
		personIds: string[];
		subjectTitle: string | null;
		hasUnread: boolean;
	};

	const unreadCount = $derived(notifications.filter((n) => n.status === 'unread').length);

	function groupKey(n: NotificationItem): string {
		const payload = n.payload as NotificationPayload | null;
		switch (n.type) {
			case 'whatsapp_message':
			case 'whatsapp_unread':
				// group by person, not by individual message
				return `${n.type}:${payload?.personId ?? n.id}`;
			case 'generic':
				// each generic notification stands alone
				return n.id;
			default:
				return `${n.type}:${n.referenceId}`;
		}
	}

	const groups = $derived.by(() => {
		const map = new Map<string, NotificationGroup>();
		for (const n of notifications) {
			const key = groupKey(n);
			const payload = n.payload as NotificationPayload | null;
			if (!map.has(key)) {
				map.set(key, {
					key,
					type: n.type,
					referenceId: n.referenceId,
					notifications: [],
					latestAt: n.createdAt,
					personNames: [],
					personIds: [],
					subjectTitle: payload?.subjectTitle ?? null,
					hasUnread: false
				});
			}
			const group = map.get(key)!;
			group.notifications.push(n);
			if (n.createdAt != null && (group.latestAt == null || n.createdAt > group.latestAt)) {
				group.latestAt = n.createdAt;
			}
			if (n.status === 'unread') group.hasUnread = true;
			const name = payload?.personName;
			const pid = payload?.personId;
			if (name && !group.personNames.includes(name)) group.personNames.push(name);
			if (pid && !group.personIds.includes(pid)) group.personIds.push(pid);
		}
		return [...map.values()].sort((a, b) => (b.latestAt ?? 0) - (a.latestAt ?? 0));
	});

	// count of groups (not raw notifications) per type. used in the digest
	const digestCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const g of groups) counts[g.type] = (counts[g.type] ?? 0) + 1;
		return counts;
	});

	function formatNames(names: string[]): string {
		if (names.length === 0) return '';
		if (names.length === 1) return names[0];
		if (names.length === 2) return `${names[0]} and ${names[1]}`;
		const others = names.length - 2;
		return `${names[0]}, ${names[1]}, and ${others} other${others > 1 ? 's' : ''}`;
	}

	function subjectUrl(type: string, referenceId: string): string | null {
		switch (type) {
			case 'event_signup':
				return `/events/${referenceId}`;
			case 'petition_signup':
				return `/petitions/${referenceId}`;
			default:
				return null;
		}
	}

	function groupTimestamp(group: NotificationGroup): string {
		if (group.latestAt == null) return '';
		return formatShortTimestamp(group.latestAt, locale.current);
	}

	function label(n: NotificationItem): string {
		const payload = n.payload as NotificationPayload | null;
		switch (n.type) {
			case 'event_signup':
				return payload?.personName
					? `${payload.personName} signed up for an event`
					: 'New event signup';
			case 'petition_signup':
				return payload?.personName
					? `${payload.personName} signed a petition`
					: 'New petition signature';
			case 'whatsapp_unread':
			case 'whatsapp_message':
				return payload?.personId ? 'New WhatsApp message' : 'New WhatsApp message';
			case 'flow_notify_user':
				return payload?.message ? String(payload.message) : 'Flow alert';
			default:
				return payload?.message ? String(payload.message) : 'Notification';
		}
	}

	function dotColor(type: string): string {
		switch (type) {
			case 'whatsapp_unread':
			case 'whatsapp_message':
				return 'bg-emerald-500';
			case 'event_signup':
				return 'bg-primary';
			case 'petition_signup':
				return 'bg-violet-500';
			case 'flow_notify_user':
				return 'bg-amber-500';
			default:
				return 'bg-muted-foreground';
		}
	}

	function timestamp(n: NotificationItem): string {
		if (n.createdAt == null) return '';
		return formatShortTimestamp(n.createdAt, locale.current);
	}
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<Card.Title class="text-sm">Recent notifications</Card.Title>
			{#if unreadCount > 0}
				<span
					class="text-destructive-foreground flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium"
				>
					{unreadCount}
				</span>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		{#if query.details.type === 'unknown'}
			<p class="py-4 text-center text-xs text-muted-foreground">Loading...</p>
		{:else if notifications.length === 0}
			<div class="flex flex-col items-center gap-1.5 py-8 text-center">
				<BellIcon class="size-6 text-muted-foreground/50" />
				<p class="text-xs text-muted-foreground">No notifications yet</p>
			</div>
		{:else}
			<ul class="divide-y">
				{#each notifications as n (n.id)}
					<li class="flex items-start gap-3 py-2.5 first:pt-0">
						<span
							class="mt-1.5 size-2 shrink-0 rounded-full {dotColor(n.type)} {n.status === 'unread'
								? 'opacity-100'
								: 'opacity-30'}"
						></span>
						<div class="min-w-0 flex-1">
							<p
								class="text-xs leading-snug {n.status === 'unread'
									? 'font-medium'
									: 'text-muted-foreground'}"
							>
								{label(n)}
							</p>
							<p class="mt-0.5 text-[10px] text-muted-foreground">{timestamp(n)}</p>
						</div>
					</li>
				{/each}
			</ul>
			<Button variant="ghost" size="sm" href="/notifications" class="mt-2 h-7 w-full text-xs">
				View all
			</Button>
		{/if}
	</Card.Content>
</Card.Root>
