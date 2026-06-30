<script lang="ts">
	import { resolve } from '$app/paths';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import { locale, t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import type { NotificationGroup } from './types';

	const { group }: { group: NotificationGroup } = $props();
	const person = $derived(group.people[0]);

	function groupTimestamp(): string {
		if (group.latestAt == null) return '';
		return formatShortTimestamp(group.latestAt, locale.current);
	}

	async function markAsRead() {
		const unread = group.notifications.filter((n) => n.status === 'unread');
		await Promise.all(
			unread.map((n) =>
				z.mutate(
					mutators.notification.markAsRead({
						metadata: { organizationId: appState.organizationId, notificationId: n.id }
					})
				)
			)
		);
	}
</script>

<div class="flex items-start gap-2">
	<div
		class="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600"
	>
		<MessageCircleIcon class="size-3.5" />
	</div>
	<div class="min-w-0 flex-1">
		{#if person?.id}
			<a
				href={resolve(`/community/${person.id}`)}
				class="text-[12px] leading-snug font-medium hover:underline"
			>
				{person.name}
			</a>
		{:else}
			<span class="text-[12px] leading-snug font-medium">{person?.name ?? t`Unknown`}</span>
		{/if}
		<p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
			{t`Sent a WhatsApp message`}
		</p>
		<div class="mt-1.5 flex items-center gap-1.5">
			{#if person?.id}
				<a
					href={resolve(`/community/${person.id}`)}
					onclick={markAsRead}
					class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
				>
					{t`View person`}
				</a>
			{/if}
			<span class="ml-auto text-[10px] text-muted-foreground/70">{groupTimestamp()}</span>
		</div>
	</div>
</div>
