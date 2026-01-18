<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import * as Table from '$lib/components/ui/table/index.js';

	// Permission check: only admins and owners can view API keys
	const canView = $derived(appState.isAdminOrOwner);
</script>

{#if !canView}
	<ContentLayout rootLink="/settings">
		<Card.Root>
			<Card.Content>
				<p>You don't have permission to view API keys. Only admins and owners can access this page.</p>
			</Card.Content>
		</Card.Root>
	</ContentLayout>
{:else}
	<ContentLayout rootLink="/settings">
		<Card.Root>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Key</Table.Head>
							<Table.Head>Created</Table.Head>
							<Table.Head>Expires</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row>
							<Table.Cell colspan="5" class="text-center text-muted-foreground">
								No API keys found
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		{#snippet header()}
			<div class="flex items-center justify-between">
				<H2>API Keys</H2>
				{#if appState.isAdmin}
					<ResponsiveModal>
						<h1>Create API Key</h1>
						{#snippet trigger()}
							<Button variant="outline"><PlusIcon /> New</Button>
						{/snippet}
					</ResponsiveModal>
				{/if}
			</div>
		{/snippet}
	</ContentLayout>
{/if}
