<script lang="ts">
	import { resolve } from '$app/paths';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import { locale, t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import type { NotificationGroup, NotificationGroupPerson } from './types';

	const { group }: { group: NotificationGroup } = $props();

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

{#snippet personNameLink(person: NotificationGroupPerson)}
	{#if person.id}
		<a href={resolve(`/community/${person.id}`)} class="font-medium text-foreground hover:underline"
			>{person.name}</a
		>
	{:else}
		{person.name}
	{/if}
{/snippet}

<div class="flex items-start gap-2">
	<div
		class="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600"
	>
		<FileTextIcon class="size-3.5" />
	</div>
	<div class="min-w-0 flex-1">
		<div class="flex items-baseline gap-1.5">
			<a
				href={resolve(`/petitions/${group.referenceId}`)}
				class="truncate text-[12px] leading-snug font-medium hover:underline"
			>
				{group.subjectTitle ?? t`Petition`}
			</a>
			{#if group.notifications.length > 1}
				<span
					class="shrink-0 rounded bg-violet-500/10 px-1 py-px text-[10px] font-medium text-violet-600"
				>
					+{group.notifications.length}
				</span>
			{/if}
		</div>
		<p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
			{#each group.people.slice(0, 2) as person, i (person.id ?? person.name)}
				{#if i > 0}{i === group.people.length - 1 || group.people.length > 2
						? ', '
						: ` ${t`and`} `}{/if}
				{@render personNameLink(person)}
			{/each}
			{#if group.people.length > 2}
				{@const extra = group.people.length - 2}
				, {t`and`}
				{extra}
				{extra > 1 ? t`others` : t`other`}
			{/if}
			{group.people.length > 0 ? ` ${t`signed`}` : t`New signature`}
		</p>
		<div class="mt-1.5 flex items-center gap-1.5">
			<a
				href={resolve(`/petitions/${group.referenceId}`)}
				onclick={markAsRead}
				class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
			>
				{t`View petition`}
			</a>
			<span class="ml-auto text-[10px] text-muted-foreground/70">{groupTimestamp()}</span>
		</div>
	</div>
</div>
