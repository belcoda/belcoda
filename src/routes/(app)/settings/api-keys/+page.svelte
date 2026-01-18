<script lang="ts">
	import { onMount } from 'svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import { formatApiKeyDate } from '$lib/utils/date';
	import { maskApiKey, type ApiKeyDisplay } from '$lib/utils/api-key';

	// Permission check: only admins and owners can view API keys
	const canView = $derived(appState.isAdminOrOwner);

	// API Keys state
	let apiKeys = $state<ApiKeyDisplay[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Load API keys
	async function loadApiKeys() {
		try {
			loading = true;
			error = null;
			const result = await authClient.apiKey.list();
			if (result.error) {
				throw new Error(result.error.message || 'Failed to load API keys');
			}
			apiKeys = (result.data || []) as ApiKeyDisplay[];
		} catch (e: any) {
			error = e.message || 'An error occurred while loading API keys';
			console.error('Error loading API keys:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (canView) {
			loadApiKeys();
		}
	});
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
		{#if error}
			<Alert.Root variant="destructive" class="mb-4">
				<AlertCircleIcon />
				<Alert.Title>Error</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		<Card.Root>
			<Card.Content>
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<Spinner />
					</div>
				{:else if apiKeys.length === 0}
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
								<Table.Cell colspan={5} class="text-center text-muted-foreground">
									No API keys found
								</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				{:else}
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
							{#each apiKeys as key}
								<Table.Row>
									<Table.Cell class="font-medium">{key.name}</Table.Cell>
									<Table.Cell class="font-mono text-sm">{maskApiKey(key)}</Table.Cell>
									<Table.Cell>{formatApiKeyDate(key.createdAt)}</Table.Cell>
									<Table.Cell>{formatApiKeyDate(key.expiresAt)}</Table.Cell>
									<Table.Cell class="text-right">
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
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
