<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import { listWebhooks } from '$lib/zero/query/webhook/list';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { v7 as uuidv7 } from 'uuid';
	import { parse } from 'valibot';
	import { createWebhookZero, deleteMutatorSchemaZero, type ReadWebhookZero } from '$lib/schema/webhook';
	import { toast } from 'svelte-sonner';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { formatDate } from '$lib/utils/date';

	let webhookListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const webhookList = $derived.by(() =>
		z.createQuery(listWebhooks(appState.queryContext, webhookListFilter))
	);

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
				eventTypes: ['all'] as const,
				secret: '' // Will be generated server-side
			});

			const response = z.mutate.webhook.create({
				metadata: {
					webhookId,
					organizationId: appState.organizationId
				},
				input: parsed
			});

			await response.server;
			toast.success('Webhook created successfully');
			createModalOpen = false;
			name = '';
			targetUrl = '';
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create webhook');
		}
	}

	function handleDeleteWebhook(webhook: { id: string; name: string }) {
		if (!window.confirm(`Are you sure you want to delete the webhook "${webhook.name}"?`)) {
			return;
		}

		try {
			const parsed = parse(deleteMutatorSchemaZero, {
				metadata: {
					webhookId: webhook.id,
					organizationId: appState.organizationId
				}
			});

			z.mutate.webhook.delete(parsed);
			toast.success('Webhook deleted');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete webhook');
		}
	}

	function formatEventTypes(eventTypes: string[]): string {
		if (eventTypes.includes('all')) {
			return 'All events';
		}
		return eventTypes.join(', ');
	}
</script>

<ContentLayout rootLink="/settings" {header}>
	<div class="space-y-4">
		{#if webhookList.details.type === 'complete' && webhookList.data && webhookList.data.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-muted-foreground mb-4">No webhooks configured</p>
				{#if appState.isOwner}
					<Button onclick={() => (createModalOpen = true)}>Create Webhook</Button>
				{/if}
			</div>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Target URL</Table.Head>
						<Table.Head>Event Types</Table.Head>
						<Table.Head>Created</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if webhookList.data}
						{#each webhookList.data as webhook (webhook.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{webhook.name}</Table.Cell>
								<Table.Cell>
									<a
										href={webhook.targetUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary hover:underline"
									>
										{webhook.targetUrl}
									</a>
								</Table.Cell>
								<Table.Cell>{formatEventTypes(webhook.eventTypes)}</Table.Cell>
								<Table.Cell>{formatDate(webhook.createdAt)}</Table.Cell>
								<Table.Cell class="text-right">
									{#if appState.isAdminOrOwner}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => handleDeleteWebhook({ id: webhook.id, name: webhook.name })}
										>
											<TrashIcon class="h-4 w-4" />
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="text-center text-muted-foreground py-8">
								Loading webhooks...
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
		<H2>Webhooks</H2>
		{#if appState.isOwner}
			<ResponsiveModal title="Create Webhook" description="Register a new webhook endpoint" bind:open={createModalOpen}>
				{#snippet trigger()}
					<Button>Create Webhook</Button>
				{/snippet}
				{#snippet children()}
					<div class="space-y-2">
						<Label for="webhook-name-header">Name</Label>
						<Input
							id="webhook-name-header"
							bind:value={name}
							placeholder="My Webhook"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="webhook-url-header">Target URL</Label>
						<Input
							id="webhook-url-header"
							bind:value={targetUrl}
							type="url"
							placeholder="https://example.com/webhook"
							required
						/>
					</div>
				{/snippet}
				{#snippet footer()}
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => (createModalOpen = false)}>Cancel</Button>
						<Button onclick={handleCreateWebhook}>Create</Button>
					</div>
				{/snippet}
			</ResponsiveModal>
		{/if}
	</div>
{/snippet}
