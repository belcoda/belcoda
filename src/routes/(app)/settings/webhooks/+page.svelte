<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { getListFilter, appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { v7 as uuidv7 } from 'uuid';
	import { parse } from 'valibot';
	import { createWebhookZero, deleteMutatorSchemaZero } from '$lib/schema/webhook';
	import { toast } from 'svelte-sonner';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import { formatDate } from '$lib/utils/date';
	import { resolve } from '$app/paths';
	import { t } from '$lib/index.svelte';
	let webhookListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const webhookList = $derived.by(() => z.createQuery(queries.webhook.list(webhookListFilter)));

	let createModalOpen = $state(false);
	let name = $state('');
	let targetUrl = $state('');

	async function handleCreateWebhook() {
		if (!name.trim() || !targetUrl.trim()) {
			toast.error('Please fill in all required fields');
			return;
		}

		try {
			const webhookId = uuidv7();
			const parsed = parse(createWebhookZero, {
				name: name.trim(),
				targetUrl: targetUrl.trim(),
				eventTypes: ['all'] as const
			});

			const response = z.mutate(
				mutators.webhook.create({
					metadata: {
						webhookId,
						organizationId: appState.organizationId
					},
					input: parsed
				})
			);

			await response.server;
			toast.success(t`Webhook created successfully`);
			createModalOpen = false;
			name = '';
			targetUrl = '';
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t`Failed to create webhook`);
		}
	}

	function handleDeleteWebhook(webhook: { id: string; name: string }) {
		if (!window.confirm(t`Are you sure you want to delete the webhook "${webhook.name}"?`)) {
			return;
		}

		try {
			const parsed = parse(deleteMutatorSchemaZero, {
				metadata: {
					webhookId: webhook.id,
					organizationId: appState.organizationId
				}
			});

			z.mutate(mutators.webhook.delete(parsed));
			toast.success(t`Webhook deleted`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t`Failed to delete webhook`);
		}
	}

	function formatEventTypes(eventTypes: string[]): string {
		if (eventTypes.includes('all')) {
			return t`All events`;
		}
		return eventTypes.join(', ');
	}
</script>

<ContentLayout rootLink="/settings" {header}>
	<div class="space-y-4" data-testid="settings-webhooks">
		{#if webhookList.details.type === 'complete' && webhookList.data && webhookList.data.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="mb-4 text-muted-foreground">{t`No webhooks configured`}</p>
				{#if appState.isOwner}
					<Button onclick={() => (createModalOpen = true)}>
						{t`Create Webhook`}
					</Button>
				{/if}
			</div>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{t`Name`}</Table.Head>
						<Table.Head>{t`Target URL`}</Table.Head>
						<Table.Head>{t`Event Types`}</Table.Head>
						<Table.Head>{t`Created`}</Table.Head>
						<Table.Head class="text-right">{t`Actions`}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if webhookList.data}
						{#each webhookList.data as webhook (webhook.id)}
							<Table.Row data-testid="settings-webhooks-row">
								<Table.Cell class="font-medium">{webhook.name}</Table.Cell>
								<Table.Cell>
									<Button
										type="button"
										variant="link"
										class="h-auto p-0 text-left break-all"
										data-testid="settings-webhooks-target-link"
										onclick={() => window.open(webhook.targetUrl, '_blank', 'noopener,noreferrer')}
									>
										{webhook.targetUrl}
									</Button>
								</Table.Cell>
								<Table.Cell>{formatEventTypes(webhook.eventTypes)}</Table.Cell>
								<Table.Cell>{formatDate(webhook.createdAt)}</Table.Cell>
								<Table.Cell class="text-right">
									{#if appState.isAdminOrOwner}
										<div class="inline-flex items-center justify-end gap-0">
											<Button
												variant="ghost"
												size="sm"
												href={resolve(`/settings/webhooks/${webhook.id}/logs`)}
												data-testid="settings-webhooks-logs"
												aria-label={t`View delivery logs`}
											>
												<ScrollTextIcon class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												data-testid="settings-webhooks-delete"
												onclick={() => handleDeleteWebhook({ id: webhook.id, name: webhook.name })}
											>
												<TrashIcon class="h-4 w-4" />
											</Button>
										</div>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="py-8 text-center text-muted-foreground">
								{t`Loading webhooks...`}
							</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		{/if}
	</div>
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<H2>{t`Webhooks`}</H2>
		{#if appState.isOwner}
			<ResponsiveModal
				title={t`Create Webhook`}
				description={t`Register a new webhook endpoint`}
				bind:open={createModalOpen}
			>
				{#snippet trigger()}
					<Button data-testid="settings-webhooks-create">{t`Create Webhook`}</Button>
				{/snippet}
				<div class="space-y-2">
					<Label for="webhook-name-header">{t`Name`}</Label>
					<Input
						id="webhook-name-header"
						data-testid="settings-webhooks-name-input"
						bind:value={name}
						placeholder={t`My Webhook`}
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="webhook-url-header">{t`Target URL`}</Label>
					<Input
						id="webhook-url-header"
						data-testid="settings-webhooks-url-input"
						bind:value={targetUrl}
						type="url"
						placeholder={t`https://example.com/webhook`}
						required
					/>
				</div>
				{#snippet footer()}
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => (createModalOpen = false)}>{t`Cancel`}</Button>
						<Button data-testid="settings-webhooks-submit" onclick={handleCreateWebhook}>
							{t`Create`}
						</Button>
					</div>
				{/snippet}
			</ResponsiveModal>
		{/if}
	</div>
{/snippet}
