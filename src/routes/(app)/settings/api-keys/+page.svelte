<script lang="ts">
	import { t } from '$lib/index.svelte';
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
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Label from '$lib/components/ui/label/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	// Permission check: only admins and owners can view API keys
	const canView = $derived(appState.isAdminOrOwner);

	// API Keys state
	let apiKeys = $state<ApiKeyDisplay[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Create API Key Modal state
	let modalOpen = $state(false);
	let creating = $state(false);
	let createError = $state<string | null>(null);
	let newKeyName = $state('');
	let newKeyExpiresAt = $state<string>('');
	let createdKey = $state<string | null>(null);

	// Delete API Key state
	let deletingKeyId = $state<string | null>(null);
	let showDeleteDialog = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);

	// Load API keys
	async function loadApiKeys() {
		try {
			loading = true;
			error = null;
			const result = await authClient.apiKey.list();
			if (result.error) {
				throw new Error(result.error.message || t`Failed to load API keys`);
			}
			apiKeys = (result.data || []) as ApiKeyDisplay[];
		} catch (e: any) {
			error = e.message || t`An error occurred while loading API keys`;
			console.error('Error loading API keys:', e);
		} finally {
			loading = false;
		}
	}

	async function handleCreateApiKey() {
		if (!newKeyName.trim()) {
			createError = t`Name is required`;
			return;
		}

		try {
			creating = true;
			createError = null;
			
			// Calculate expiresIn in seconds if expiration date is provided
			let expiresIn: number | undefined = undefined;
			if (newKeyExpiresAt) {
				const expirationDate = new Date(newKeyExpiresAt);
				const now = new Date();
				const secondsUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / 1000);
				if (secondsUntilExpiration > 0) {
					expiresIn = secondsUntilExpiration;
				}
			}

			const result = await authClient.apiKey.create({
				name: newKeyName.trim(),
				expiresIn: expiresIn || null
			});

			if (result.error) {
				throw new Error(result.error.message || t`Failed to create API key`);
			}

			// Store the full key (only shown once)
			createdKey = result.data?.key || null;

			// Reset form
			newKeyName = '';
			newKeyExpiresAt = '';

			await loadApiKeys();
		} catch (e: any) {
			createError = e.message || t`An error occurred while creating the API key`;
			console.error('Error creating API key:', e);
		} finally {
			creating = false;
		}
	}

	function handleModalClose() {
		if (!creating) {
			modalOpen = false;
			// Reset state when modal closes
			setTimeout(() => {
				newKeyName = '';
				newKeyExpiresAt = '';
				createError = null;
				createdKey = null;
			}, 300); // Wait for animation
		}
	}

	function copyKeyToClipboard() {
		if (createdKey) {
			navigator.clipboard.writeText(createdKey);
			toast.success(t`API key copied to clipboard`);
		}
	}

	function openDeleteDialog(keyId: string) {
		deletingKeyId = keyId;
		showDeleteDialog = true;
		deleteError = null;
	}

	function closeDeleteDialog() {
		if (!deleting) {
			showDeleteDialog = false;
			setTimeout(() => {
				deletingKeyId = null;
				deleteError = null;
			}, 300);
		}
	}

	async function handleDeleteApiKey() {
		if (!deletingKeyId || deleting) return;

		try {
			deleting = true;
			deleteError = null;

			const result = await authClient.apiKey.delete({
				keyId: deletingKeyId as string
			});

			if (result.error) {
				throw new Error(result.error.message || t`Failed to delete API key`);
			}

			apiKeys = apiKeys.filter((key) => key.id !== deletingKeyId);
			toast.success(t`API key deleted successfully`);
			
			// Close dialog and reset state
			showDeleteDialog = false;
			setTimeout(() => {
				deletingKeyId = null;
				deleteError = null;
			}, 300);
		} catch (e: any) {
			deleteError = e.message || t`An error occurred while deleting the API key`;
			console.error('Error deleting API key:', e);
		} finally {
			deleting = false;
		}
	}

	// Check if user can delete (admins and owners)
	const canDelete = $derived(appState.isAdminOrOwner);

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
				<p>{t`You don't have permission to view API keys. Only admins and owners can access this page.`}</p>
			</Card.Content>
		</Card.Root>
	</ContentLayout>
{:else}
	<ContentLayout rootLink="/settings">
		{#if error}
			<Alert.Root variant="destructive" class="mb-4">
				<AlertCircleIcon />
				<Alert.Title>{t`Error`}</Alert.Title>
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
								<Table.Head>{t`Name`}</Table.Head>
								<Table.Head>{t`Key`}</Table.Head>
								<Table.Head>{t`Created`}</Table.Head>
								<Table.Head>{t`Expires`}</Table.Head>
								<Table.Head class="text-right">{t`Actions`}</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell colspan={5} class="text-center text-muted-foreground">
									{t`No API keys found`}
								</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>{t`Name`}</Table.Head>
								<Table.Head>{t`Key`}</Table.Head>
								<Table.Head>{t`Created`}</Table.Head>
								<Table.Head>{t`Expires`}</Table.Head>
								<Table.Head class="text-right">{t`Actions`}</Table.Head>
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
										{#if canDelete}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => openDeleteDialog(key.id)}
												title={t`Delete API key`}
												class="text-destructive hover:text-destructive"
											>
												<TrashIcon class="h-4 w-4" />
											</Button>
										{/if}
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
				<H2>{t`API Keys`}</H2>
				{#if appState.isAdminOrOwner}
					<ResponsiveModal bind:open={modalOpen} title={t`Create API Key`}>
						{#snippet trigger()}
							<Button variant="outline"><PlusIcon /> {t`New`}</Button>
						{/snippet}

						{#if createdKey}
							<div class="space-y-4">
								<Alert.Root variant="default">
									<AlertCircleIcon />
									<Alert.Title>{t`API Key Created`}</Alert.Title>
									<Alert.Description>
										{t`This key will not be shown again. Please copy it now.`}
									</Alert.Description>
								</Alert.Root>

								<div class="space-y-2">
									<Label.Root>{t`Your API Key`}</Label.Root>
									<div class="flex items-center gap-2">
										<Input
											value={createdKey}
											readonly
											class="font-mono text-sm"
											id="api-key-display"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											onclick={copyKeyToClipboard}
											title={t`Copy to clipboard`}
										>
											<CopyIcon class="h-4 w-4" />
										</Button>
									</div>
								</div>

								<div class="flex justify-end gap-2 pt-2">
									<Button type="button" variant="outline" onclick={handleModalClose}>
										{t`Close`}
									</Button>
								</div>
							</div>
							{:else}
							<div class="space-y-4">
								{#if createError}
									<Alert.Root variant="destructive">
										<AlertCircleIcon />
										<Alert.Title>{t`Error`}</Alert.Title>
										<Alert.Description>{createError}</Alert.Description>
									</Alert.Root>
								{/if}

								<div class="space-y-2">
									<Label.Root for="key-name">{t`Name`}</Label.Root>
									<Input
										id="key-name"
										bind:value={newKeyName}
										placeholder={t`e.g., Production API Key`}
										required
										disabled={creating}
									/>
								</div>

								<div class="space-y-2">
									<Label.Root for="key-expires">{t`Expires At (Optional)`}</Label.Root>
									<Input
										id="key-expires"
										type="datetime-local"
										bind:value={newKeyExpiresAt}
										disabled={creating}
									/>
									<p class="text-sm text-muted-foreground">
										{t`Leave empty for a key that never expires`}
									</p>
								</div>

								<div class="flex justify-end gap-2 pt-2">
									<Button type="button" variant="outline" onclick={handleModalClose} disabled={creating}>
										{t`Cancel`}
									</Button>
									<Button type="button" onclick={handleCreateApiKey} disabled={creating || !newKeyName.trim()}>
										{#if creating}
											<Spinner class="mr-2 h-4 w-4" />
											{t`Creating...`}
										{:else}
											<CheckIcon class="mr-2 h-4 w-4" />
											{t`Create`}
										{/if}
									</Button>
								</div>
							</div>
						{/if}
					</ResponsiveModal>
				{/if}
			</div>
		{/snippet}
	</ContentLayout>

	<!-- Delete Confirmation Dialog -->
	<Dialog.Root bind:open={showDeleteDialog}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>{t`Delete API Key`}</Dialog.Title>
				<Dialog.Description>
					{t`Are you sure you want to delete this API key? This action cannot be undone and any applications using this key will lose access immediately.`}
				</Dialog.Description>
			</Dialog.Header>

			{#if deleteError}
				<Alert.Root variant="destructive" class="mt-4">
					<AlertCircleIcon />
					<Alert.Title>{t`Error`}</Alert.Title>
					<Alert.Description>{deleteError}</Alert.Description>
				</Alert.Root>
			{/if}

			<Dialog.Footer>
				<div class="flex gap-2 justify-end">
					<Button variant="outline" onclick={closeDeleteDialog} disabled={deleting}>
						{t`Cancel`}
					</Button>
					<Button variant="destructive" onclick={handleDeleteApiKey} disabled={deleting}>
						{#if deleting}
							<Spinner class="mr-2 h-4 w-4" />
							{t`Deleting...`}
						{:else}
							<TrashIcon class="mr-2 h-4 w-4" />
							{t`Delete`}
						{/if}
					</Button>
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
