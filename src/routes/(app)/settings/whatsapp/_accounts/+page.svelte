<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { appState } from '$lib/state.svelte';
	import type { ReadWhatsappAccountZero } from '$lib/schema/whatsapp-account';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';

	const accounts = $derived.by(() =>
		z.createQuery(
			queries.whatsappAccount.list({
				organizationId: appState.organizationId,
				isDeleted: false
			})
		)
	);

	// The caller may edit an account when:
	//   - it is user-scoped and owned by them, or
	//   - it is organization-scoped and they are an admin/owner of the current org.
	function canEdit(account: ReadWhatsappAccountZero): boolean {
		if (account.scope === 'user') {
			return account.referenceId === appState.userId;
		}
		return appState.isAdminOrOwner;
	}
</script>

<ContentLayout rootLink="/settings">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="whatsapp-accounts-heading">
				{t`WhatsApp accounts`}
			</h1>
			<Button
				variant="default"
				size="sm"
				href="/settings/whatsapp/_accounts/new"
				data-testid="whatsapp-accounts-link"
			>
				<PlusIcon class="size-4" />
				{t`Link account`}
			</Button>
		</div>
	{/snippet}

	{#if accounts.data && accounts.data.length > 0}
		<Card.Root>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>{t`Name`}</Table.Head>
							<Table.Head>{t`Identifier`}</Table.Head>
							<Table.Head>{t`Scope`}</Table.Head>
							<Table.Head>{t`Type`}</Table.Head>
							<Table.Head class="w-[80px] text-right">&nbsp;</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each accounts.data as account (account.id)}
							<Table.Row data-testid="whatsapp-account-row" data-account-id={account.id}>
								<Table.Cell class="font-medium" data-testid="whatsapp-account-row-name">
									{account.metadata.displayName ?? account.identifier}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{account.identifier}</Table.Cell>
								<Table.Cell>
									<Badge variant="secondary">
										{account.scope === 'organization' ? t`Organization` : t`Personal`}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{#if account.metadata.isBusiness}
										<Badge variant="default">{t`Business`}</Badge>
									{:else}
										<Badge variant="outline">{t`Personal`}</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									{#if canEdit(account)}
										<Button
											variant="outline"
											size="sm"
											href="/settings/whatsapp/_accounts/{account.id}"
											data-testid="whatsapp-account-edit"
											data-account-id={account.id}
										>
											{t`Edit`}
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{:else if accounts.data}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<MessageCircleIcon />
				</Empty.Media>
				<Empty.Title>{t`No WhatsApp accounts`}</Empty.Title>
				<Empty.Description>
					{t`You don't have access to any WhatsApp accounts yet.`}
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{/if}
</ContentLayout>
