<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Empty from '$lib/components/ui/empty';
	import Send from '@lucide/svelte/icons/send';
	import { getTimeAgo } from '$lib/utils/time';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { listEmailMessages } from '$lib/zero/query/email_message/list';

	const timeAgo = getTimeAgo('en');

	const sentEmailsFilter = $state({
		organizationId: appState.organizationId,
		isDraft: false,
		pageSize: 50,
		excludedIds: [],
		searchString: null,
		isDeleted: null,
		teamId: null,
		startAfter: null
	});

	const sentEmailsQuery = $derived.by(() =>
		z.createQuery(listEmailMessages(appState.queryContext, sentEmailsFilter))
	);
	const sentEmails = $derived(sentEmailsQuery.data ?? []);
</script>

<ContentLayout rootLink="/communications">
	<div class="container mx-auto max-w-6xl py-8">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="mb-2 text-3xl font-bold">Sent Emails</h1>
				<p class="text-muted-foreground">View your sent email campaigns</p>
			</div>
			<Button href="/communications/drafts/email/new" data-sveltekit-preload-data="off">
				New Email
			</Button>
		</div>

		{#if sentEmails.length === 0}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<Send />
							</Empty.Media>
							<Empty.Title>No sent emails</Empty.Title>
							<Empty.Description>
								You haven't sent any email campaigns yet.
							</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Button href="/communications/drafts/email/new" data-sveltekit-preload-data="off">
								Create Email Campaign
							</Button>
						</Empty.Content>
					</Empty.Root>
				{:else}
					<div class="rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Subject</Table.Head>
									<Table.Head>Recipients</Table.Head>
									<Table.Head>Sent</Table.Head>
									<Table.Head>Status</Table.Head>
									<Table.Head class="w-[100px]">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each sentEmails as email}
									<Table.Row>
										<Table.Cell>
											<div class="font-medium">{email.subject || 'Untitled'}</div>
										</Table.Cell>
										<Table.Cell>
											<div class="text-sm">
												<div class="text-muted-foreground">
													{email.successfulRecipientCount} sent
												</div>
												{#if email.failedRecipientCount > 0}
													<div class="text-destructive text-xs">
														{email.failedRecipientCount} failed
													</div>
												{/if}
											</div>
										</Table.Cell>
										<Table.Cell>
											<span class="text-muted-foreground text-sm">
												{email.completedAt ? timeAgo.format(new Date(email.completedAt)) : 'Unknown'}
											</span>
										</Table.Cell>
										<Table.Cell>
											{#if email.completedAt}
												<span class="text-xs text-green-600">Completed</span>
											{:else if email.startedAt}
												<span class="text-xs text-yellow-600">Sending...</span>
											{/if}
										</Table.Cell>
										<Table.Cell>
											<Button href="/communications/sent/email/{email.id}" variant="ghost" size="sm">
												View
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
	</div>
</ContentLayout>
