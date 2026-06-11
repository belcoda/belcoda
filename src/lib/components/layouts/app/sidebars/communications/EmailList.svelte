<script lang="ts">
	import { t } from '$lib/index.svelte';
	import FileIcon from '@lucide/svelte/icons/file';
	import Send from '@lucide/svelte/icons/send';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { jsonToText } from '$lib/components/ui/wysiwyg/renderRichText';
	import { Input } from '$lib/components/ui/input/index.js';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodeCommunicationsListCursor } from '$lib/utils/communications/cursor';
	import { type ReadEmailMessageZero } from '$lib/schema/email-message';
	import type { ListEmailMessagesInput } from '$lib/zero/query/email_message/list';
	import { IsInViewport, watch } from 'runed';

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
	const pageSize = 25;
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));
	const paginatedEmails = new PaginatedZeroList<ListEmailMessagesInput, ReadEmailMessageZero>({
		getBaseFilter: () => ({
			...getListFilter(appState.organizationId),
			searchString: search,
			isDraft: activeItem.isDraft,
			reverseCron: true
		}),
		encodeCursor: encodeEmailCursor,
		pageSize
	});
	const emailsQuery = $derived.by(() =>
		z.createQuery(queries.emailMessage.list(paginatedEmails.pageFilter))
	);

	watch(
		() => emailsQuery.data,
		(data) => {
			paginatedEmails.handlePage(data);
		}
	);
	watch(
		() =>
			[
				sentinelIsInViewport.current,
				paginatedEmails.hasMore,
				paginatedEmails.items.length
			] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedEmails.loadMore();
			}
		}
	);

	function encodeEmailCursor(email: ReadEmailMessageZero) {
		return encodeCommunicationsListCursor({ updatedAt: email.updatedAt, id: email.id });
	}
</script>

<div
	class="flex min-h-0 w-full flex-1 flex-col bg-background md:w-[300px] md:shrink-0"
	data-testid="email-list"
>
	<div class="flex flex-col gap-3 border-b p-4">
		<div class="flex w-full items-center justify-between">
			<div class="text-xl font-semibold text-foreground">
				{activeItem.title}
			</div>
		</div>
		<Input placeholder={t`Type to search...`} bind:value={search} data-testid="email-list-search" />
	</div>
	<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-testid="email-list-scroll">
		<div class="flex flex-col">
			{#if paginatedEmails.items.length > 0}
				{#each paginatedEmails.items as email (email.id)}
					<a
						href="/communications/email/{folder}/{email.id}"
						data-testid="email-list-item"
						data-email-id={email.id}
						class="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-muted"
					>
						<div class="flex w-full items-center justify-between gap-2">
							<div class="line-clamp-1 font-medium">{email.subject || t`(No subject)`}</div>
							<div class="text-xs text-nowrap text-muted-foreground">
								{formatShortTimestamp(email.updatedAt)}
							</div>
						</div>
						{#if email.previewTextOverride}
							<span class="line-clamp-2 text-xs text-muted-foreground">
								{email.previewTextOverride}
							</span>
						{:else if email.body}
							<span class="line-clamp-2 text-xs text-muted-foreground">
								{jsonToText(JSON.stringify(email.body))}
							</span>
						{/if}
					</a>
				{/each}
				{#if paginatedEmails.hasMore}
					<div bind:this={sentinel} class="h-1" data-testid="email-list-scroll-sentinel"></div>
				{/if}
			{:else if emailsQuery.data}
				<div class="flex flex-col items-center justify-center p-8 text-center">
					<p class="text-sm text-muted-foreground">{t`No emails found`}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
