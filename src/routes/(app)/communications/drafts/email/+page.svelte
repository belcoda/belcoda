<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Empty from '$lib/components/ui/empty';
	import Mail from '@lucide/svelte/icons/mail';
	import { getTimeAgo } from '$lib/utils/time';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { listEmailMessages } from '$lib/zero/query/email_message/list';

	const timeAgo = getTimeAgo('en');

	const emailDraftsFilter = $state({
		organizationId: appState.organizationId,
		isDraft: true,
		pageSize: 50,
		excludedIds: [],
		searchString: null,
		isDeleted: null,
		teamId: null,
		startAfter: null
	});

	const emailDraftsQuery = $derived.by(() =>
		z.createQuery(listEmailMessages(appState.queryContext, emailDraftsFilter))
	);
	const emailDrafts = $derived(emailDraftsQuery.data ?? []);
</script>

<ContentLayout rootLink="/communications">
	<div class="container mx-auto max-w-6xl py-8">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="mb-2 text-3xl font-bold">Email Drafts</h1>
				<p class="text-muted-foreground">Manage your email campaign drafts</p>
			</div>
			<Button href="/communications/drafts/email/new" data-sveltekit-preload-data="off">
				New Email
			</Button>
		</div>

		{#if emailDrafts.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<Mail />
					</Empty.Media>
					<Empty.Title>No email drafts</Empty.Title>
					<Empty.Description>
						Create your first email campaign to get started.
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button href="/communications/drafts/email/new" data-sveltekit-preload-data="off">
						Create Email Draft
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
							<Table.Head>Last Updated</Table.Head>
							<Table.Head class="w-[100px]">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each emailDrafts as draft}
							<Table.Row>
								<Table.Cell>
									<a
										href="/communications/drafts/email/{draft.id}"
										class="font-medium hover:underline"
									>
										{draft.subject || 'Untitled'}
									</a>
								</Table.Cell>
								<Table.Cell>
									<span class="text-muted-foreground text-sm">
										~{draft.estimatedRecipientCount} recipients
									</span>
								</Table.Cell>
								<Table.Cell>
									<span class="text-muted-foreground text-sm">
										{draft.updatedAt ? timeAgo.format(new Date(draft.updatedAt)) : 'Never'}
									</span>
								</Table.Cell>
								<Table.Cell>
									<Button href="/communications/drafts/email/{draft.id}" variant="ghost" size="sm">
										Edit
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
