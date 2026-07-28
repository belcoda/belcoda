<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { locale, t } from '$lib/index.svelte';
	import type { NotificationPayload } from '$lib/schema/notification/payload';
	import type { NotificationGroup } from './types';
	import NotificationGroupEvent from './NotificationGroupEvent.svelte';
	import NotificationGroupWhatsApp from './NotificationGroupWhatsApp.svelte';
	import NotificationGroupPetition from './NotificationGroupPetition.svelte';
	import NotificationGroupConversationMention from './NotificationGroupConversationMention.svelte';

	const notifications = $derived(appState.notificationItems);
	type NotificationItem = (typeof notifications)[number];

	const unreadCount = $derived(notifications.filter((n) => n.status === 'unread').length);

	function groupKey(n: NotificationItem): string {
		const payload = n.payload as NotificationPayload | null;
		switch (n.type) {
			case 'whatsapp_message':
			case 'whatsapp_unread':
				return `whatsapp:${payload?.personId ?? n.id}`;
			case 'generic':
			case 'conversation_mention':
				return n.id;
			default:
				return `${n.type}:${n.referenceId}`;
		}
	}

	const groups = $derived.by(() => {
		const map = new SvelteMap<string, NotificationGroup>();
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
					people: [],
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
			if (name) {
				const person = group.people.find((person) => person.id === pid || person.name === name);
				if (person) {
					person.id ??= pid ?? null;
				} else {
					group.people.push({ name, id: pid ?? null });
				}
			}
		}
		return [...map.values()].sort((a, b) => (b.latestAt ?? 0) - (a.latestAt ?? 0));
	});

	const digestCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const g of groups) counts[g.type] = (counts[g.type] ?? 0) + 1;
		return counts;
	});

	type DigestKind = 'signup' | 'signature' | 'message' | 'alert' | 'notification';
	type DigestEntry = { kind: DigestKind; dotClass: string };
	const digestEntries: Record<string, DigestEntry> = {
		event_signup: { kind: 'signup', dotClass: 'bg-primary' },
		petition_signup: { kind: 'signature', dotClass: 'bg-violet-500' },
		whatsapp_message: { kind: 'message', dotClass: 'bg-emerald-500' },
		whatsapp_unread: { kind: 'message', dotClass: 'bg-emerald-500' },
		flow_notify_user: { kind: 'alert', dotClass: 'bg-amber-500' },
		conversation_mention: { kind: 'notification', dotClass: 'bg-primary' },
		generic: { kind: 'notification', dotClass: 'bg-muted-foreground' }
	};

	function digestLabel(kind: DigestKind, count: number): string {
		void locale.current;
		switch (kind) {
			case 'signup':
				return count === 1 ? t`signup` : t`signups`;
			case 'signature':
				return count === 1 ? t`signature` : t`signatures`;
			case 'message':
				return count === 1 ? t`message` : t`messages`;
			case 'alert':
				return count === 1 ? t`alert` : t`alerts`;
			case 'notification':
				return count === 1 ? t`notification` : t`notifications`;
		}
	}

	const digest = $derived.by(() => {
		const merged: { key: string; kind: DigestKind; dotClass: string; count: number }[] = [];
		const seen = new SvelteSet<string>();
		for (const [type, count] of Object.entries(digestCounts)) {
			const entry =
				digestEntries[type] ??
				({
					kind: 'notification',
					dotClass: 'bg-muted-foreground'
				} satisfies DigestEntry);
			const chipKey = type.startsWith('whatsapp') ? 'whatsapp' : type;
			const existing = merged.find((d) => d.key === chipKey);
			if (existing) {
				existing.count += count;
			} else if (!seen.has(chipKey)) {
				seen.add(chipKey);
				merged.push({ key: chipKey, kind: entry.kind, dotClass: entry.dotClass, count });
			}
		}
		return merged.map((chip) => ({ ...chip, label: digestLabel(chip.kind, chip.count) }));
	});

	function fallbackTimestamp(group: NotificationGroup): string {
		if (group.latestAt == null) return '';
		return formatShortTimestamp(group.latestAt, locale.current);
	}
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<Card.Title class="text-sm">{t`Recent notifications`}</Card.Title>
			{#if unreadCount > 0}
				<span
					class="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-300 px-1 text-[10px] font-medium text-orange-700"
				>
					{unreadCount}
				</span>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		{#if appState.notifications.details.type === 'unknown'}
			<p class="py-4 text-center text-xs text-muted-foreground">{t`Loading...`}</p>
		{:else if notifications.length === 0}
			<div class="flex flex-col items-center gap-1.5 py-8 text-center">
				<BellIcon class="size-6 text-muted-foreground/50" />
				<p class="text-xs text-muted-foreground">{t`No notifications yet`}</p>
			</div>
		{:else}
			{#if digest.length > 0}
				<div
					class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-muted/50 px-2.5 py-1.5"
				>
					{#each digest as chip, i (chip.key)}
						{#if i > 0}<span class="text-[10px] text-muted-foreground">·</span>{/if}
						<span class="flex items-center gap-1 text-[11px] text-muted-foreground">
							<span class="size-1.5 rounded-full {chip.dotClass}"></span>
							{chip.count}
							{chip.label}
						</span>
					{/each}
				</div>
			{/if}

			<ul class="divide-y">
				{#each groups as group (group.key)}
					<li class="py-2.5 first:pt-0">
						{#if group.type === 'event_signup'}
							<NotificationGroupEvent {group} />
						{:else if group.type === 'petition_signup'}
							<NotificationGroupPetition {group} />
						{:else if group.type === 'whatsapp_message' || group.type === 'whatsapp_unread'}
							<NotificationGroupWhatsApp {group} />
						{:else if group.type === 'conversation_mention'}
							<NotificationGroupConversationMention {group} />
						{:else}
							<p class="text-xs {group.hasUnread ? 'font-medium' : 'text-muted-foreground'}">
								{(group.notifications[0]?.payload as { message?: string } | null)?.message ??
									t`Notification`}
							</p>
							<p class="mt-0.5 text-[10px] text-muted-foreground">{fallbackTimestamp(group)}</p>
						{/if}
					</li>
				{/each}
			</ul>

			<Button variant="ghost" size="sm" href="/notifications" class="mt-2 h-7 w-full text-xs">
				{t`View all`}
			</Button>
		{/if}
	</Card.Content>
</Card.Root>
