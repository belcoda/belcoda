<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import { listTags } from '$lib/zero/query/tag/list';
	let tagListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const tagList = $derived.by(() => z.createQuery(listTags(appState.queryContext, tagListFilter)));
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
</script>

<ContentLayout rootLink="/settings">
	<Card.Root>
		<Card.Content>
			{#each tagList.data as tag}
				<div>{tag.name}</div>
			{/each}
		</Card.Content>
	</Card.Root>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>Tags</H2>
			<ResponsiveModal>
				<h1>Add Tag</h1>
				{#snippet trigger()}
					<Button variant="outline">Add Tag</Button>
				{/snippet}
			</ResponsiveModal>
		</div>
	{/snippet}
</ContentLayout>
