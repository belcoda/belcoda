<script lang="ts">
	import { resolve } from '$app/paths';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import { locale, t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import type { NotificationGroup, NotificationGroupPerson } from './types';

	const SIGNER_ONE_MARKER = '__SIGNER_ONE__';
	const SIGNER_TWO_MARKER = '__SIGNER_TWO__';

	type SignatureMessagePart =
		| { type: 'text'; value: string }
		| { type: 'person'; value: NotificationGroupPerson };

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

	function extraSignerCount(): number {
		return group.people.length - 2;
	}

	function formattedExtraSignerCount(): string {
		return extraSignerCount().toString();
	}

	function signatureMessage(): string {
		if (group.people.length === 0) return t`New signature`;
		if (group.people.length === 1) return t`${SIGNER_ONE_MARKER} signed the petition`;
		if (group.people.length === 2) {
			return t`${SIGNER_ONE_MARKER} and ${SIGNER_TWO_MARKER} signed the petition`;
		}
		if (extraSignerCount() === 1) {
			return t`${SIGNER_ONE_MARKER}, ${SIGNER_TWO_MARKER}, and 1 other signed the petition`;
		}
		return t`${SIGNER_ONE_MARKER}, ${SIGNER_TWO_MARKER}, and ${formattedExtraSignerCount()} others signed the petition`;
	}

	function signatureMessageParts(): SignatureMessagePart[] {
		return signatureMessage()
			.split(/(__SIGNER_ONE__|__SIGNER_TWO__)/g)
			.flatMap((part): SignatureMessagePart[] => {
				if (!part) return [];
				if (part === SIGNER_ONE_MARKER && group.people[0]) {
					return [{ type: 'person', value: group.people[0] }];
				}
				if (part === SIGNER_TWO_MARKER && group.people[1]) {
					return [{ type: 'person', value: group.people[1] }];
				}
				return [{ type: 'text', value: part }];
			});
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
			{#each signatureMessageParts() as part, i (i)}
				{#if part.type === 'person'}
					{@render personNameLink(part.value)}
				{:else}
					{part.value}
				{/if}
			{/each}
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
