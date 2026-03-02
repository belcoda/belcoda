<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import NewTag from './NewTag.svelte';
	import EditTag from './EditTag.svelte';
	import Badge from '$lib/components/ui/colorbadge/badge.svelte';
	import { formatDate } from '$lib/utils/date';

	let tagListFilter = $state({
		...getListFilter(appState.organizationId),
		includeDeleted: true
	});
	const tagList = $derived.by(() => z.createQuery(queries.tag.list(tagListFilter)));
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
						{#if tagList.data && tagList.data.length === 0}
							<Table.Row>
								<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
									{t`No tags yet. Create your first tag to get started.`}
								</Table.Cell>
							</Table.Row>
						{:else if tagList.data}
							{#each tagList.data as tag (tag.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{tag.name}</Table.Cell>
									<Table.Cell>
										<Badge color={tag.active ? 'green' : 'gray'}>
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
			</Card.Content>
		</Card.Root>
	</div>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>{t`Tags`}</H2>
			<NewTag />
		</div>
	{/snippet}
</ContentLayout>
