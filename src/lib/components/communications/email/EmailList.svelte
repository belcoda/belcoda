<script lang="ts">
	import { t } from '$lib/index.svelte';
	import FileIcon from '@lucide/svelte/icons/file';
	import Send from '@lucide/svelte/icons/send';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import { formatShortTimestamp } from '$lib/utils/date';

	const { folder }: { folder?: string } = $props();

	const activeItem = $derived.by(() => {
		switch (folder) {
			case 'sent':
				return {
					title: t`Sent`,
					icon: Send,
					isDraft: false
				};
			case 'drafts':
				return {
					title: t`Drafts`,
					icon: FileIcon,
					isDraft: true
				};
			default:
				return {
					title: t`Drafts`,
					icon: FileIcon,
					isDraft: true
				};
		}
	});

	let search = $state('');
	const emailFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId),
		searchString: search,
		isDraft: activeItem.isDraft
	}));

	const emailsQuery = $derived.by(() =>
		z.createQuery(queries.emailMessage.list(emailFilter))
	);

	const emails = $derived(emailsQuery.data ?? []);
	const recipientCountLabel = (count: number) => {
		return t`${count.toString()} recipients`;
	};

	function getRecipientDisplay(email: (typeof emails)[0]) {
		const count = email.estimatedRecipientCount;
		if (count === 1) {
			// For single recipient, we'd need to fetch the actual recipient name
			// For now, show "1 recipient"
			return t`1 recipient`;
		}
		return recipientCountLabel(count);
	}
	import { Input } from '$lib/components/ui/input/index.js';
</script>

<div class="flex w-full flex-col bg-background md:w-[300px] md:shrink-0">
	<div class="flex flex-col gap-3 border-b p-4">
		<div class="flex w-full items-center justify-between">
			<div class="text-xl font-semibold text-foreground">
				{activeItem.title}
			</div>
		</div>
		<Input placeholder={t`Type to search...`} bind:value={search} />
	</div>
	<div class="flex-1 overflow-auto">
		<div class="flex flex-col">
			{#each emails as email (email.id)}
				<a
					href="/communications/email/{folder}/{email.id}"
					class="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-muted"
				>
					<div class="flex w-full items-center gap-2">
						<span>{getRecipientDisplay(email)}</span>
						<span class="ms-auto text-xs text-muted-foreground"
							>{formatShortTimestamp(email.updatedAt)}</span
						>
					</div>
					<span class="font-medium">{email.subject || t`(No subject)`}</span>
					{#if email.previewTextOverride}
						<span class="line-clamp-2 text-xs text-muted-foreground">
							{email.previewTextOverride}
						</span>
					{/if}
				</a>
			{:else}
				<div class="flex flex-col items-center justify-center p-8 text-center">
					<p class="text-sm text-muted-foreground">{t`No emails found`}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
