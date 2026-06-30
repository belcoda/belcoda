<script lang="ts">
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import { locale, t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import type { NotificationGroup } from './types';

	const { group }: { group: NotificationGroup } = $props();

	function formatNames(names: string[]): string {
		if (names.length === 0) return '';
		if (names.length === 1) return names[0];
		if (names.length === 2) return `${names[0]} ${t`and`} ${names[1]}`;
		const others = names.length - 2;
		return `${names[0]}, ${names[1]}, ${t`and`} ${others} ${others > 1 ? t`others` : t`other`}`;
	}

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
		class="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
	>
		<CalendarDaysIcon class="size-3.5" />
	</div>
	<div class="min-w-0 flex-1">
		<div class="flex items-baseline gap-1.5">
			<a
				href="/events/{group.referenceId}"
				class="truncate text-[12px] leading-snug font-medium hover:underline"
			>
				{group.subjectTitle ?? t`Event`}
			</a>
			{#if group.notifications.length > 1}
				<span
					class="shrink-0 rounded bg-primary/10 px-1 py-px text-[10px] font-medium text-primary"
				>
					+{group.notifications.length}
				</span>
			{/if}
		</div>
		<p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
			{#each group.personNames.slice(0, 2) as name, i (name)}
				{#if i > 0}{i === group.personNames.length - 1 || group.personNames.length > 2
						? ', '
						: ` ${t`and`} `}{/if}
				{#if group.personIds[i]}
					<a
						href="/community/{group.personIds[i]}"
						class="font-medium text-foreground hover:underline">{name}</a
					>
				{:else}
					{name}
				{/if}
			{/each}
			{#if group.personNames.length > 2}
				{@const extra = group.personNames.length - 2}
				, {t`and`}
				{extra}
				{extra > 1 ? t`others` : t`other`}
			{/if}
			{group.personNames.length > 0 ? ` ${t`signed up`}` : t`New signup`}
		</p>
		<div class="mt-1.5 flex items-center gap-1.5">
			<a
				href="/events/{group.referenceId}"
				onclick={markAsRead}
				class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
			>
				{t`View event`}
			</a>
			<a
				href="/events/{group.referenceId}/signups"
				onclick={markAsRead}
				class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
			>
				{t`Email all`}
			</a>
			<span class="ml-auto text-[10px] text-muted-foreground/70">{groupTimestamp()}</span>
		</div>
	</div>
</div>
