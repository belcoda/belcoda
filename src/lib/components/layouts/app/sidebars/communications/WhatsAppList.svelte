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
	const whatsappThreadFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId),
		searchString: search,
		isDraft: activeItem.isDraft,
		reverseCron: true
	}));

	const whatsappThreadsQuery = $derived.by(() =>
		z.createQuery(queries.whatsappThread.list(whatsappThreadFilter))
	);

	const whatsappThreads = $derived(whatsappThreadsQuery.data ?? []);

	import { Input } from '$lib/components/ui/input/index.js';
</script>

<div class="flex w-full flex-col bg-background md:w-[300px] md:shrink-0">
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
	<div class="flex-1 overflow-auto">
		<div class="flex flex-col">
			{#each whatsappThreads as whatsappThread (whatsappThread.id)}
				<a
					href="/communications/whatsapp/{folder}/{whatsappThread.id}"
					data-testid="communications-whatsapp-thread-row"
					data-thread-id={whatsappThread.id}
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
			{:else}
				<div class="flex flex-col items-center justify-center p-8 text-center">
					<p class="text-sm text-muted-foreground">{t`No WhatsApp threads found`}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
