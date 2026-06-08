<script lang="ts">
	import { locale, t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import NewTag from './NewTag.svelte';
	import EditTag from './EditTag.svelte';
	import Badge from '$lib/components/ui/colorbadge/badge.svelte';
	import { formatDate } from '$lib/utils/date';
	import { formatNumber } from '$lib/utils/number';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodeTagListCursor } from '$lib/utils/tag/cursor';
	import { type ReadTagZero } from '$lib/schema/tag';
	import { watch } from 'runed';

	let tagListFilter = $state({
		...getListFilter(appState.organizationId),
		includeInactive: true
	});
	const pageSize = 25;
	const paginatedTags = new PaginatedZeroList({
		getBaseFilter: () => tagListFilter,
		encodeCursor: encodeTagCursor,
		pageSize
	});
	const tagList = $derived.by(() => z.createQuery(queries.tag.list(paginatedTags.pageFilter)));

	watch(
		() => tagList.data,
		(data) => {
			paginatedTags.handlePage(data);
		}
	);

	function encodeTagCursor(tag: ReadTagZero) {
		return encodeTagListCursor({ createdAt: tag.createdAt, id: tag.id });
	}

	function handleTagCreated() {
		paginatedTags.reset();
	}
</script>

<ContentLayout rootLink="/settings">
	<div class="space-y-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Tags`}</Card.Title>
				<Card.Description>
					{t`Manage tags for organizing and categorizing your contacts.`}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>{t`Name`}</Table.Head>
							<Table.Head>{t`Status`}</Table.Head>
							<Table.Head>{t`Created`}</Table.Head>
							<Table.Head class="w-[80px] text-right">{t`Actions`}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if tagList.data !== undefined && paginatedTags.items.length === 0}
							<Table.Row>
								<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
									{t`No tags yet. Create your first tag to get started.`}
								</Table.Cell>
							</Table.Row>
						{:else if paginatedTags.items.length > 0}
							{#each paginatedTags.items as tag (tag.id)}
								<Table.Row data-testid="tag-row" data-tag-id={tag.id}>
									<Table.Cell class="font-medium" data-testid="tag-row-name">{tag.name}</Table.Cell>
									<Table.Cell>
										<Badge color={tag.active ? 'green' : 'gray'} data-testid="tag-row-status">
											{tag.active ? t`Active` : t`Inactive`}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-muted-foreground">{formatDate(tag.createdAt)}</Table.Cell>
									<Table.Cell class="text-right">
										<EditTag {tag} />
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={4} class="py-8 text-center text-muted-foreground">
									{t`Loading tags...`}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
				{#if paginatedTags.items.length > 0}
					<div class="mt-4 space-y-2">
						<div class="text-center text-xs text-muted-foreground">
							{t`${formatNumber(paginatedTags.items.length, locale.current)} shown`}
						</div>
						{#if paginatedTags.hasMore}
							<Button
								variant="ghost"
								class="w-full"
								data-testid="tags-load-more"
								disabled={paginatedTags.loadingMore}
								onclick={() => paginatedTags.loadMore()}
							>
								{t`Load more`}
							</Button>
						{/if}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>{t`Tags`}</H2>
			<NewTag onCreated={handleTagCreated} />
		</div>
	{/snippet}
</ContentLayout>
