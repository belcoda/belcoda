<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import type { ReadWhatsappAccountZero } from '$lib/schema/whatsapp-account';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label/index.js';

	const { params } = $props();
	const LIST_URL = resolve('/settings/whatsapp/_accounts') as `/${string}`;

	const account = $derived.by(() =>
		z.createQuery(queries.whatsappAccount.read({ whatsappAccountId: params.id }))
	);

	// Same rule as the list page: user-scoped accounts are editable by their owner,
	// organization-scoped accounts by admins/owners of the current organization.
	function canEdit(record: ReadWhatsappAccountZero): boolean {
		if (record.scope === 'user') {
			return record.referenceId === appState.userId;
		}
		return appState.isAdminOrOwner;
	}

	// Editable metadata fields (everything except `isBusiness`, which is fixed).
	let displayName = $state('');
	let profilePic = $state('');
	let status = $state('');
	let initializedId = $state<string | null>(null);

	$effect(() => {
		const record = account.data;
		if (record && record.id !== initializedId) {
			displayName = record.metadata.displayName ?? '';
			profilePic = record.metadata.profilePic ?? '';
			status = record.metadata.status ?? '';
			initializedId = record.id;
		}
	});

	async function handleSave(record: ReadWhatsappAccountZero) {
		// Preserve `isBusiness`; coerce empty optional fields back to `undefined`.
		const result = z.mutate(
			mutators.whatsappAccount.updateMetadata({
				metadata: { whatsappAccountId: record.id },
				input: {
					metadata: {
						isBusiness: record.metadata.isBusiness,
						displayName: displayName.trim() || undefined,
						profilePic: profilePic.trim() || undefined,
						status: status.trim() || undefined
					}
				}
			})
		);
		await result.client;
		await goto(LIST_URL);
	}

	async function handleUnlink(record: ReadWhatsappAccountZero) {
		if (!window.confirm(t`Are you sure you want to unlink this WhatsApp account?`)) {
			return;
		}
		const result = z.mutate(
			mutators.whatsappAccount.unlink({
				metadata: { whatsappAccountId: record.id }
			})
		);
		await result.client;
		await goto(LIST_URL);
	}
</script>

<ContentLayout rootLink={LIST_URL}>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="whatsapp-account-edit-heading">
				{t`Edit WhatsApp account`}
			</h1>
		</div>
	{/snippet}

	{#if account.data}
		{@const record = account.data}
		{#if canEdit(record)}
			<div class="space-y-6">
				<Card.Root>
					<Card.Header>
						<Card.Title>{t`Account details`}</Card.Title>
						<Card.Description>
							{t`Update the display information for this WhatsApp account.`}
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label>{t`Identifier`}</Label>
							<Input type="text" value={record.identifier} disabled />
							<p class="text-xs text-muted-foreground">
								{t`The phone number or WhatsApp username. This cannot be changed.`}
							</p>
						</div>

						<div class="space-y-2">
							<Label>{t`Type`}</Label>
							<div>
								{#if record.metadata.isBusiness}
									<Badge variant="default">{t`Business`}</Badge>
								{:else}
									<Badge variant="outline">{t`Personal`}</Badge>
								{/if}
							</div>
						</div>

						<div class="space-y-2">
							<Label for="displayName">{t`Display name`}</Label>
							<Input
								id="displayName"
								type="text"
								bind:value={displayName}
								placeholder={t`e.g., Campaign hotline`}
								data-testid="whatsapp-account-display-name"
							/>
						</div>

						<div class="space-y-2">
							<Label for="status">{t`Status`}</Label>
							<Input
								id="status"
								type="text"
								bind:value={status}
								placeholder={t`e.g., Available`}
								data-testid="whatsapp-account-status"
							/>
						</div>

						<div class="space-y-2">
							<Label for="profilePic">{t`Profile picture URL`}</Label>
							<Input
								id="profilePic"
								type="url"
								bind:value={profilePic}
								placeholder={t`https://…`}
								data-testid="whatsapp-account-profile-pic"
							/>
						</div>
					</Card.Content>
					<Card.Footer class="justify-end gap-2">
						<Button variant="outline" href={LIST_URL}>{t`Cancel`}</Button>
						<Button data-testid="whatsapp-account-save" onclick={() => handleSave(record)}>
							{t`Save changes`}
						</Button>
					</Card.Footer>
				</Card.Root>

				<Card.Root class="border-destructive">
					<Card.Header>
						<Card.Title class="text-destructive">{t`Danger zone`}</Card.Title>
						<Card.Description>
							{t`Unlinking removes this account. This action cannot be undone.`}
						</Card.Description>
					</Card.Header>
					<Card.Footer class="justify-end">
						<Button
							variant="destructive"
							data-testid="whatsapp-account-unlink"
							onclick={() => handleUnlink(record)}
						>
							{t`Unlink account`}
						</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		{:else}
			<Card.Root>
				<Card.Content class="py-8 text-center text-muted-foreground">
					{t`You don't have permission to edit this WhatsApp account.`}
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</ContentLayout>
