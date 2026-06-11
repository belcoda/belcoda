<script lang="ts">
	import { t } from '$lib/index.svelte';
	import FileIcon from '@lucide/svelte/icons/file';
	import Send from '@lucide/svelte/icons/send';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input/index.js';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodeCommunicationsListCursor } from '$lib/utils/communications/cursor';
	import { type ReadWhatsappThreadZero } from '$lib/schema/whatsapp-thread';
	import type { ListWhatsappThreadsInput } from '$lib/zero/query/whatsapp_thread/list';
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
	const paginatedThreads = new PaginatedZeroList<ListWhatsappThreadsInput, ReadWhatsappThreadZero>({
		getBaseFilter: () => ({
			...getListFilter(appState.organizationId),
			searchString: search,
			isDraft: activeItem.isDraft,
			reverseCron: true
		}),
		encodeCursor: encodeThreadCursor,
		pageSize
	});
	const whatsappThreadsQuery = $derived.by(() =>
		z.createQuery(queries.whatsappThread.list(paginatedThreads.pageFilter))
	);

	const whatsAppThreadId = $derived(page.params.whatsappThreadId);

	watch(
		() => whatsappThreadsQuery.data,
		(data) => {
			paginatedThreads.handlePage(data);
		}
	);
	watch(
		() =>
			[
				sentinelIsInViewport.current,
				paginatedThreads.hasMore,
				paginatedThreads.items.length
			] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedThreads.loadMore();
			}
		}
	);

	function encodeThreadCursor(thread: ReadWhatsappThreadZero) {
		return encodeCommunicationsListCursor({ updatedAt: thread.updatedAt, id: thread.id });
	}
</script>

<div class="flex min-h-0 w-full flex-1 flex-col bg-background md:w-[300px] md:shrink-0">
	<div class="flex flex-col gap-3 border-b p-4">
		<div class="flex w-full items-center justify-between">
			<div class="text-xl font-semibold text-foreground">
				{activeItem.title}
			</div>
		</div>
		<Input
			placeholder={t`Type to search...`}
			data-testid="communications-whatsapp-search-input"
			bind:value={search}
		/>
	</div>
	<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-testid="whatsapp-list-scroll">
		<div class="flex flex-col">
			{#if paginatedThreads.items.length > 0}
				{#each paginatedThreads.items as whatsappThread (whatsappThread.id)}
					<a
						href="/communications/whatsapp/{folder}/{whatsappThread.id}"
						data-testid="communications-whatsapp-thread-row"
						data-thread-id={whatsappThread.id}
						class:bg-muted={whatsappThread.id === whatsAppThreadId}
						class="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-muted"
					>
						<div class="flex w-full items-center justify-between gap-2">
							<div
								class="line-clamp-1 font-medium"
								data-testid="communications-whatsapp-thread-title"
							>
								{whatsappThread.title || t`(No title)`}
							</div>
							<div class="text-xs text-nowrap text-muted-foreground">
								{formatShortTimestamp(whatsappThread.updatedAt)}
							</div>
						</div>
						{#if whatsappThread.description}
							<span class="line-clamp-2 text-xs text-muted-foreground">
								{whatsappThread.description}
							</span>
						{/if}
					</a>
				{/each}
				{#if paginatedThreads.hasMore}
					<div bind:this={sentinel} class="h-1" data-testid="whatsapp-list-scroll-sentinel"></div>
				{/if}
			{:else if whatsappThreadsQuery.data}
				<div class="flex flex-col items-center justify-center p-8 text-center">
					<p class="text-sm text-muted-foreground">{t`No WhatsApp threads found`}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
