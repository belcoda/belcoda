<script lang="ts">
	import { resolve } from '$app/paths';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	import { locale, t } from '$lib/index.svelte';
	import type { NotificationPayload } from '$lib/schema/notification/payload';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { z } from '$lib/zero.svelte';
	import type { NotificationGroup } from './types';

	const { group }: { group: NotificationGroup } = $props();
	const notification = $derived(group.notifications[0]);
	const payload = $derived(notification?.payload as NotificationPayload | null);
	const actorName = $derived(payload?.actorName ?? t`A teammate`);
	const personName = $derived(payload?.personName ?? t`this person`);

	async function markAsRead() {
		if (!notification || notification.status !== 'unread') return;
		await z.mutate(
			mutators.notification.markAsRead({
				metadata: {
					organizationId: appState.organizationId,
					notificationId: notification.id
				}
			})
		);
	}
</script>

<div class="flex items-start gap-2">
	<div
		class="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
	>
		<UserPlusIcon class="size-3.5" />
	</div>
	<div class="min-w-0 flex-1">
		<p class="text-[12px] leading-snug font-medium">
			{t`${actorName} invited you to join the conversation with ${personName}`}
		</p>
		<div class="mt-1.5 flex items-center gap-1.5">
			<a
				href={resolve(`/community/${group.referenceId}`)}
				onclick={markAsRead}
				class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
			>
				{t`View conversation`}
			</a>
			<span class="ml-auto text-[10px] text-muted-foreground/70">
				{group.latestAt === null ? '' : formatShortTimestamp(group.latestAt, locale.current)}
			</span>
		</div>
	</div>
</div>
