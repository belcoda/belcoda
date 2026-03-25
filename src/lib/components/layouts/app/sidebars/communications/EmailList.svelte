<script lang="ts">
	import { t } from '$lib/index.svelte';
	import FileIcon from '@lucide/svelte/icons/file';
	import Send from '@lucide/svelte/icons/send';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { jsonToHtml } from '$lib/components/ui/wysiwyg/renderRichText';
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
		isDraft: activeItem.isDraft,
		reverseCron: true
	}));

	const emailsQuery = $derived.by(() => z.createQuery(queries.emailMessage.list(emailFilter)));

	const emails = $derived(emailsQuery.data ?? []);

	import { Input } from '$lib/components/ui/input/index.js';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
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
						{#await jsonToHtml(JSON.stringify(email.body))}
							<Skeleton class="h-3 w-full" />
							<Skeleton class="h-3 w-full" />
						{:then html}
							<span class="prose line-clamp-2 text-xs text-muted-foreground">{@html html}</span>
						{:catch}
							<span class="line-clamp-2 text-xs text-red-400">{t`[Error loading email body]`}</span>
						{/await}
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
