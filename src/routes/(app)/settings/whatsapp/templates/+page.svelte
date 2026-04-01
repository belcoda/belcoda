<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { getLocalizedLanguageName, clampLanguageCode } from '$lib/utils/language';
	import { getListFilter, appState } from '$lib/state.svelte';
	let templatesListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const templates = $derived.by(() => {
		return z.createQuery(queries.whatsappTemplate.list(templatesListFilter));
	});
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { mutators } from '$lib/zero/mutate/client_mutators';
</script>

<ContentLayout rootLink="/settings">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">{t`WhatsApp templates`}</h1>
			{#if appState.activeOrganization.data?.settings?.whatsApp?.wabaId}
				<Button variant="default" size="sm" href="/settings/whatsapp/templates/new">
					{t`Create template`}
				</Button>
			{/if}
		</div>
	{/snippet}
	{#if appState.activeOrganization.data?.settings?.whatsApp?.wabaId}
		{#if templates.data?.length > 0}
			<Card.Root>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>{t`Name`}</Table.Head>
								<Table.Head>{t`Language`}</Table.Head>
								<Table.Head>{t`Status`}</Table.Head>
								<Table.Head class="w-[80px] text-right">&nbsp;</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each templates.data as template}
								<Table.Row>
									<Table.Cell>{template.name}</Table.Cell>
									<Table.Cell
										>{getLocalizedLanguageName(clampLanguageCode(template.locale))}</Table.Cell
									>
									<Table.Cell class="uppercase">
										{#if template.status === 'APPROVED'}
											<Badge variant="default">{t`Approved`}</Badge>
										{:else if template.status === 'REJECTED'}
											<Badge variant="destructive">{t`Rejected`}</Badge>
										{:else if template.status === 'IN_APPEAL'}
											<Badge variant="secondary">{t`In appeal`}</Badge>
										{:else if template.status === 'PENDING_DELETION'}
											<Badge variant="secondary">{t`Pending deletion`}</Badge>
										{:else if template.status === 'DISABLED'}
											<Badge variant="secondary">{t`Disabled`}</Badge>
										{:else if template.status === 'PAUSED'}
											<Badge variant="secondary">{t`Paused`}</Badge>
										{:else if template.status === 'NOT_SUBMITTED'}
											<Badge variant="secondary">{t`Not submitted`}</Badge>
										{/if}
										{#if template.status === 'LIMIT_EXCEEDED'}
											<Badge variant="secondary">{t`Limit exceeded`}</Badge>
										{/if}
										{#if template.status === 'PENDING'}
											<Badge variant="secondary"><Spinner /> {t`Pending`}</Badge>
										{/if}
									</Table.Cell>
									<Table.Cell class="flex items-center justify-end gap-2 text-right">
										{#if template.status === 'NOT_SUBMITTED'}
											<Button
												variant="outline"
												size="sm"
												onclick={() => {
													z.mutate(
														mutators.whatsappTemplate.submit({
															whatsappTemplateId: template.id,
															organizationId: appState.organizationId
														})
													);
												}}
											>
												{t`Submit`}
											</Button>
										{/if}
										<Button
											variant="outline"
											size="sm"
											href="/settings/whatsapp/templates/{template.id}"
										>
											{t`Edit`}
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<MessageCircleIcon />
					</Empty.Media>
					<Empty.Title>{t`No templates found`}</Empty.Title>
					<Empty.Description
						>{t`Create a new template and submit it for approval to get started.`}</Empty.Description
					>
				</Empty.Header>
				<Empty.Content>
					<Button variant="default" size="sm" href="/settings/whatsapp/templates/new">
						{t`Create template`}
					</Button>
				</Empty.Content>
			</Empty.Root>
		{/if}
	{:else}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<MessageCircleIcon />
				</Empty.Media>
				<Empty.Title>{t`No business account activated`}</Empty.Title>
				<Empty.Description
					>{t`You must activate a business account before creating templates`}</Empty.Description
				>
			</Empty.Header>
			<Empty.Content>
				<Button variant="default" size="sm" href="/settings/whatsapp/accounts">
					{t`Activate business account`}
				</Button>
			</Empty.Content>
		</Empty.Root>
	{/if}
</ContentLayout>
